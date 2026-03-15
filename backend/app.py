"""
智卷通 - AI试卷诊断与精准提分工具后端API
双引擎驱动: Gemini (视觉识别) + DeepSeek (逻辑诊断)
"""

import os
import json
import base64
from io import BytesIO
from typing import List, Dict, Any, Optional
from datetime import datetime

from flask import Flask, request, jsonify
from flask_cors import CORS
from werkzeug.utils import secure_filename
import google.generativeai as genai
from openai import OpenAI

# 初始化 Flask 应用
app = Flask(__name__)
CORS(app)

# 配置
UPLOAD_FOLDER = 'uploads'
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'webp'}
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = 50 * 1024 * 1024  # 50MB max

# 初始化 AI 引擎
# Gemini 用于视觉识别与归并
GEMINI_API_KEY = os.environ.get('VITE_GEMINI_API_KEY')
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)
    gemini_model = genai.GenerativeModel('gemini-pro-vision')
else:
    gemini_model = None

# DeepSeek 用于逻辑诊断与计划生成 (兼容 OpenAI 格式)
DEEPSEEK_API_KEY = os.environ.get('VITE_DEEPSEEK_API_KEY')
if DEEPSEEK_API_KEY:
    deepseek_client = OpenAI(
        api_key=DEEPSEEK_API_KEY,
        base_url="https://api.deepseek.com"
    )
else:
    deepseek_client = None


def allowed_file(filename: str) -> bool:
    """检查文件类型是否允许"""
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


def image_to_base64(image_path: str) -> str:
    """将图片转换为base64"""
    with open(image_path, 'rb') as f:
        return base64.b64encode(f.read()).decode('utf-8')


def process_with_gemini(image_paths: List[str]) -> Dict[str, Any]:
    """
    使用 Gemini 进行视觉扫描与归并
    任务：识别文字、判定正反面、逻辑成组
    """
    if not gemini_model:
        return {"error": "Gemini API 未配置"}

    vision_prompt = """
    你是一个专业的试卷扫描专家。请分析这组试卷图片：

    1. 识别每张图片顶部的姓名/学号
    2. 判断每张图是[正面]、[反面]还是[续页]
    3. 提取所有手写和印刷文字内容
    4. 按照题号逻辑，将图片按顺序排列
    5. 识别每道题目的题号和学生作答内容

    请输出严格的JSON格式：
    {
        "students": [
            {
                "name": "学生姓名",
                "student_id": "学号",
                "pages": [
                    {
                        "page_index": 1,
                        "type": "front/back/continuation",
                        "questions": [
                            {
                                "question_id": "题号",
                                "student_answer": "学生作答内容",
                                "ocr_confidence": 0.95
                            }
                        ]
                    }
                ],
                "logic_confidence": 0.98
            }
        ],
        "total_images": 图片数量,
        "processing_time_ms": 处理时间
    }
    """

    try:
        # 加载图片
        images = []
        for path in image_paths:
            with open(path, 'rb') as f:
                images.append({
                    "mime_type": "image/jpeg",
                    "data": base64.b64encode(f.read()).decode('utf-8')
                })

        # 调用 Gemini API
        response = gemini_model.generate_content([vision_prompt] + images)

        # 解析响应
        result_text = response.text
        # 尝试提取 JSON
        if '```json' in result_text:
            result_text = result_text.split('```json')[1].split('```')[0]
        elif '```' in result_text:
            result_text = result_text.split('```')[1].split('```')[0]

        return json.loads(result_text)

    except Exception as e:
        return {"error": str(e), "raw_response": response.text if 'response' in locals() else None}


def process_with_deepseek(ocr_data: Dict[str, Any], standard_answer: str, config: Dict[str, Any]) -> Dict[str, Any]:
    """
    使用 DeepSeek 进行逻辑批改与诊断
    任务：分步给分、寻找错因、生成14天计划
    """
    if not deepseek_client:
        return {"error": "DeepSeek API 未配置"}

    diagnosis_prompt = f"""
    你是一位经验丰富的特级教师，同时也是教育诊断专家。请根据以下识别出的学生答卷内容和标准答案进行深度诊断分析：

    【考试配置】
    科目: {config.get('subject', '高中英语')}
    总分: {config.get('totalScore', 150)}
    题型分布: {json.dumps(config.get('questions', []), ensure_ascii=False)}

    【标准答案】
    {standard_answer}

    【学生答卷OCR结果】
    {json.dumps(ocr_data, ensure_ascii=False, indent=2)}

    请从以下维度进行全面诊断，输出严格的JSON格式：

    {{
        "grading_results": {{
            "students": [
                {{
                    "name": "学生姓名",
                    "total_score": 得分,
                    "max_score": 总分,
                    "score_rate": 得分率,
                    "questions": [
                        {{
                            "question_id": "题号",
                            "ai_score": AI评分,
                            "max_score": 满分,
                            "is_correct": true/false/partial,
                            "error_type": "错误类型(如: 概念混淆/计算失误/审题偏差/逻辑漏洞/知识盲区)",
                            "step_analysis": "分步骤得分分析",
                            "feedback": "针对性反馈"
                        }}
                    ],
                    "score_breakdown": {{
                        "current_rate": 当前得分率百分比,
                        "gap_a": {{
                            "points": 短期可提分数,
                            "description": "3天内可追回的规范性/低级错误失分"
                        }},
                        "gap_b": {{
                            "points": 冲刺可提分数,
                            "description": "14天可攻克的逻辑漏洞/中档题型失分"
                        }}
                    }},
                    "error_path": {{
                        "breakdown_point": "掉分拐点环节(审题/理解/建模/计算/表达)",
                        "description": "具体掉分路径描述"
                    }}
                }}
            ]
        }},
        "class_analysis": {{
            "average_score": 班级平均分,
            "weak_points": [
                {{
                    "topic": "薄弱知识点",
                    "error_rate": 错误率百分比,
                    "affected_students": 影响学生数
                }}
            ],
            "knowledge_gaps": [
                {{
                    "stage": "断裂环节(审题/建模/计算/表达)",
                    "description": "集体失效描述"
                }}
            ],
            "roi_ranking": [
                {{
                    "topic": "提分主题",
                    "potential_points": 潜在提分,
                    "effort_days": 所需天数,
                    "roi_level": "high/medium/low"
                }}
            ]
        }},
        "improvement_plan_14days": {{
            "phase1_foundation": {{
                "period": "D1-D4",
                "goal": "追回白送分，清理低级错误",
                "tasks": [
                    {{
                        "day": "D1",
                        "task": "任务描述",
                        "type": "任务类型",
                        "expected_gain": "+X分"
                    }}
                ]
            }},
            "phase2_breakthrough": {{
                "period": "D5-D10",
                "goal": "针对掉分卡点进行同类题型训练",
                "tasks": []
            }},
            "phase3_closure": {{
                "period": "D11-D14",
                "goal": "压力测试与心理建设",
                "tasks": []
            }},
            "daily_instructions": {{
                "parent": [
                    {{
                        "time": "时间",
                        "task": "家长需要做的事"
                    }}
                ],
                "student": [
                    {{
                        "time": "时间",
                        "task": "学生需要做的事"
                    }}
                ]
            }}
        }},
        "teaching_suggestions": [
            {{
                "category": "建议类别",
                "title": "建议标题",
                "content": "具体建议内容"
            }}
        ]
    }}

    请从阶层流动和理性决策角度分析，优先解决分值潜力最大的薄弱点。输出要专业、精准、有深度。
    """

    try:
        response = deepseek_client.chat.completions.create(
            model="deepseek-chat",
            messages=[
                {
                    "role": "system",
                    "content": "你是一个精准教育诊断专家，擅长分析学生答卷并给出可执行的提分建议。请严格按照JSON格式输出。"
                },
                {"role": "user", "content": diagnosis_prompt}
            ],
            response_format={"type": "json_object"},
            temperature=0.3,
            max_tokens=4000
        )

        result_text = response.choices[0].message.content
        return json.loads(result_text)

    except Exception as e:
        return {"error": str(e)}


# ==================== API 路由 ====================

@app.route('/api/health', methods=['GET'])
def health_check():
    """健康检查"""
    return jsonify({
        "status": "healthy",
        "gemini_configured": gemini_model is not None,
        "deepseek_configured": deepseek_client is not None,
        "timestamp": datetime.now().isoformat()
    })


@app.route('/api/upload', methods=['POST'])
def upload_exams():
    """上传试卷图片"""
    if 'exam_images' not in request.files:
        return jsonify({"error": "未找到上传的文件"}), 400

    files = request.files.getlist('exam_images')
    config = json.loads(request.form.get('config', '{}'))
    standard_answer = request.form.get('standard_answer', '')

    saved_paths = []
    for file in files:
        if file and allowed_file(file.filename):
            filename = secure_filename(file.filename)
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            save_path = os.path.join(app.config['UPLOAD_FOLDER'], f"{timestamp}_{filename}")
            file.save(save_path)
            saved_paths.append(save_path)

    if not saved_paths:
        return jsonify({"error": "没有有效的图片文件"}), 400

    return jsonify({
        "message": "上传成功",
        "file_count": len(saved_paths),
        "file_paths": saved_paths,
        "config": config,
        "session_id": datetime.now().strftime('%Y%m%d%H%M%S')
    })


@app.route('/api/process', methods=['POST'])
def process_exams():
    """处理试卷：OCR识别 + 智能批改"""
    data = request.json
    file_paths = data.get('file_paths', [])
    config = data.get('config', {})
    standard_answer = data.get('standard_answer', '')

    if not file_paths:
        return jsonify({"error": "未提供文件路径"}), 400

    # Step 1: Gemini 视觉扫描
    ocr_result = process_with_gemini(file_paths)
    if 'error' in ocr_result:
        return jsonify({"error": f"OCR处理失败: {ocr_result['error']}"}), 500

    # Step 2: DeepSeek 逻辑诊断
    diagnosis_result = process_with_deepseek(ocr_result, standard_answer, config)
    if 'error' in diagnosis_result:
        return jsonify({"error": f"诊断处理失败: {diagnosis_result['error']}"}), 500

    return jsonify({
        "success": True,
        "ocr_result": ocr_result,
        "diagnosis_result": diagnosis_result,
        "processed_at": datetime.now().isoformat()
    })


@app.route('/api/grade', methods=['POST'])
def grade_exams():
    """单独的批改接口（用于已有OCR数据）"""
    data = request.json
    ocr_data = data.get('ocr_data', {})
    config = data.get('config', {})
    standard_answer = data.get('standard_answer', '')

    result = process_with_deepseek(ocr_data, standard_answer, config)
    return jsonify(result)


@app.route('/api/generate-plan', methods=['POST'])
def generate_improvement_plan():
    """生成14天提分计划"""
    data = request.json
    grading_results = data.get('grading_results', {})
    student_name = data.get('student_name', '')

    if not grading_results:
        return jsonify({"error": "未提供批改结果"}), 400

    # 使用 DeepSeek 生成详细的提分计划
    plan_prompt = f"""
    基于以下学生的批改结果，生成详细的14天精准提分计划：

    【学生】: {student_name}
    【批改结果】: {json.dumps(grading_results, ensure_ascii=False)}

    请生成包含以下内容的JSON格式提分计划：
    1. 三个阶段的详细任务（固本/攻坚/闭环）
    2. 每日具体执行指令（家长侧/学生侧）
    3. 预期提分目标和验收标准
    4. 心理建设建议
    """

    try:
        response = deepseek_client.chat.completions.create(
            model="deepseek-chat",
            messages=[
                {"role": "system", "content": "你是教育规划专家，擅长制定可执行的学习提升计划。"},
                {"role": "user", "content": plan_prompt}
            ],
            response_format={"type": "json_object"},
            temperature=0.5
        )

        plan = json.loads(response.choices[0].message.content)
        return jsonify(plan)

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/api/export-report', methods=['POST'])
def export_report():
    """导出诊断报告（PDF格式）"""
    data = request.json
    report_data = data.get('report_data', {})
    format_type = data.get('format', 'pdf')

    # TODO: 实现PDF生成逻辑
    return jsonify({
        "message": "报告生成中",
        "download_url": "/reports/sample_report.pdf"
    })


@app.route('/api/student/<student_id>/progress', methods=['GET'])
def get_student_progress(student_id):
    """获取单个学生的多次考试成绩进展"""

    # --- 模拟数据 ---
    # 在实际应用中，您应该从数据库中查询该学生的数据
    mock_progress_data = {
        "student_id": student_id,
        "student_name": "张三",  # 模拟姓名
        "progress": [
            {
                "exam_id": "2024-midterm",
                "exam_name": "2024学年第一学期期中考试",
                "subject": "数学",
                "date": "2024-10-15",
                "score": 128,
                "max_score": 150,
                "class_rank": 5,
                "grade_rank": 28
            },
            {
                "exam_id": "2024-monthly-1",
                "exam_name": "2024年11月月考",
                "subject": "数学",
                "date": "2024-11-20",
                "score": 135,
                "max_score": 150,
                "class_rank": 3,
                "grade_rank": 19
            },
            {
                "exam_id": "2024-final",
                "exam_name": "2024学年第一学期期末考试",
                "subject": "数学",
                "date": "2025-01-10",
                "score": 142,
                "max_score": 150,
                "class_rank": 2,
                "grade_rank": 11
            }
        ]
    }
    # --- 模拟数据结束 ---

    # 简单检查，如果找不到学生（虽然这里总是能找到）
    if not mock_progress_data:
        return jsonify({"error": "未找到该学生的信息"}), 404

    return jsonify(mock_progress_data)



# ==================== 运行 ====================

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001, debug=True)
