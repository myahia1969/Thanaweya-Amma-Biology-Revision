import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Initialize Gemini Client
  const apiKey = process.env.GEMINI_API_KEY;
  const ai = new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });

  // API routes FIRST
  app.post("/api/questions/generate", async (req, res) => {
    try {
      const { lectureId, lectureTitle, topics, difficulty } = req.body;
      
      if (!lectureId || !lectureTitle) {
        return res.status(400).json({ error: "lectureId and lectureTitle are required" });
      }

      const requestedComplexity = difficulty === 'expert' ? 'expert' : difficulty === 'high' ? 'high' : difficulty === 'medium' ? 'medium' : 'easy';

      const prompt = `أنت أستاذ خبير في مادة الأحياء لشهادة الثانوية العامة المصرية (الصف الثالث الثانوي - علمي علوم). 
قم بتوليد 5 أسئلة اختيار من متعدد (MCQ) جديدة ومبتكرة تماماً ومطابقة للنظام الجديد (أسئلة تعتمد على الفهم والتحليل والتفكير النقدي والمستويات العليا ومحاكاة تريكات امتحانات الوزارة للأعوام 2021-2025).

المعلومات الخاصة بالمحاضرة الحالية:
- رقم المحاضرة: ${lectureId}
- عنوان المحاضرة: ${lectureTitle}
- المواضيع المغطاة: ${JSON.stringify(topics)}
- الصعوبة المطلوبة: ${requestedComplexity === 'expert' ? 'مستوى خبير / تحديات استنتاجية معقدة للغاية وتوليف عابر للفصول' : requestedComplexity === 'high' ? 'مستويات عليا / تفكير عميق وربط' : requestedComplexity === 'medium' ? 'متوسط / فهم وتطبيق كلي' : 'سهل مباشر / استدعاء وتطبيق مباشر'}

شروط مهمة جداً لكل سؤال:
1. يجب أن يكون نص السؤال باللغة العربية الفصحى السليمة والدقيقة علمياً.
2. يجب توفير 4 خيارات (A, B, C, D) باللغة العربية. خيار واحد فقط منها صحيح تماماً والباقي مشتتات ذكية وجذابة للطالب المتسرع.
3. يجب كتابة "correctAnswer" كحرف واحد فقط من الأحرف التالية: "A" أو "B" أو "C" أو "D".
4. في كائن "explanation"، يجب كتابة تفسير علمي مفصل باللغة العربية للآتي:
   - "correct": تفسير لماذا الإجابة الصحيحة هي الصحيحة، وما هو الأساس العلمي من منهج الثانوية العامة بالتفصيل وبشكل مقنع للدرجة النهائية.
   - "incorrectA": لماذا الخيار A خاطئ علمياً أو غير دقيق في سياق هذا السؤال (إذا لم يكن هو الإجابة الصحيحة).
   - "incorrectB": لماذا الخيار B خاطئ (إذا لم يكن هو الإجابة الصحيحة).
   - "incorrectC": لماذا الخيار C خاطئ (إذا لم يكن هو الإجابة الصحيحة).
5. يجب أن تعكس الأسئلة مستوى الصعوبة المطلوب (${requestedComplexity}) بدقة متناهية.
6. اجعل "complexity" قيمتها إما "${requestedComplexity}".
7. اجعل "sourceYear" نصاً يوضح الصعوبة والترتيب، مثل: "بنك الأسئلة الذكي - ${requestedComplexity === 'expert' ? 'مستوى خبير' : requestedComplexity === 'high' ? 'مستويات عليا' : requestedComplexity === 'medium' ? 'مستوى متوسط' : 'مستوى سهل'}".
8. تجنب تكرار أفكار الأسئلة الكلاسيكية واجعلها تفاعلية كأنها مأخوذة من امتحانات الوزارة الحقيقية.`;

      if (!apiKey) {
        return res.status(500).json({ error: "GEMINI_API_KEY environment variable is not configured on the server." });
      }

      const response = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                questionText: { type: Type.STRING },
                options: {
                  type: Type.OBJECT,
                  properties: {
                    A: { type: Type.STRING },
                    B: { type: Type.STRING },
                    C: { type: Type.STRING },
                    D: { type: Type.STRING }
                  },
                  required: ["A", "B", "C", "D"]
                },
                correctAnswer: { type: Type.STRING },
                explanation: {
                  type: Type.OBJECT,
                  properties: {
                    correct: { type: Type.STRING },
                    incorrectA: { type: Type.STRING },
                    incorrectB: { type: Type.STRING },
                    incorrectC: { type: Type.STRING }
                  },
                  required: ["correct", "incorrectA", "incorrectB", "incorrectC"]
                },
                complexity: { type: Type.STRING },
                sourceYear: { type: Type.STRING }
              },
              required: ["id", "questionText", "options", "correctAnswer", "explanation", "complexity", "sourceYear"]
            }
          }
        }
      });

      const responseText = response.text;
      if (!responseText) {
        throw new Error("No response from Gemini API");
      }

      const questions = JSON.parse(responseText);
      res.json({ questions });
    } catch (error: any) {
      console.error("Error generating questions:", error);
      res.status(500).json({ error: error.message || "Failed to generate questions" });
    }
  });

  app.post("/api/flashcards/generate", async (req, res) => {
    try {
      const { lectureId, topic } = req.body;
      
      if (!lectureId || !topic) {
        return res.status(400).json({ error: "lectureId and topic are required" });
      }

      const prompt = `أنت أستاذ خبير في مادة الأحياء لشهادة الثانوية العامة المصرية (الصف الثالث الثانوي - علمي علوم). 
قم بتوليد بطاقة استذكار نشط (Active Recall Flashcard) ذكية ومبتكرة ومبسطة تركز على الفهم العميق والربط والتريكات الهامة للموضوع التالي:
الموضوع: "${topic}"
رقم المحاضرة: ${lectureId}

شروط بطاقة الاستذكار:
1. "category": تصنيف قصير جداً للموضوع (مثال: "آلية الانقباض العضلي"، "تنظيم الكالسيوم").
2. "question": سؤال فكري، عميق ومحفز للذهن يختبر فهم الطالب الحقيقي للفكرة أو العلاقة البيولوجية.
3. "answer": إجابة نموذجية، علمية، كاملة ومبسطة تغطي التريكات وتوضح اللبس أو الفخ الشائع بشكل مباشر وقوي.

أرجع النتيجة بتنسيق JSON مطابق تماماً للمواصفات المطلوبة.`;

      if (!apiKey) {
        return res.status(500).json({ error: "GEMINI_API_KEY environment variable is not configured on the server." });
      }

      const response = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              category: { type: Type.STRING },
              question: { type: Type.STRING },
              answer: { type: Type.STRING }
            },
            required: ["id", "category", "question", "answer"]
          }
        }
      });

      const responseText = response.text;
      if (!responseText) {
        throw new Error("No response from Gemini API");
      }

      const flashcard = JSON.parse(responseText);
      flashcard.lectureId = Number(lectureId);
      if (!flashcard.id) {
        flashcard.id = `custom_fc_${Date.now()}`;
      }
      res.json({ flashcard });
    } catch (error: any) {
      console.error("Error generating flashcard:", error);
      res.status(500).json({ error: error.message || "Failed to generate flashcard" });
    }
  });

  // Interactive AI Biology Chatbot Route
  app.post("/api/chat/send", async (req, res) => {
    try {
      const { messages, currentLectureContext } = req.body;

      if (!messages || !Array.isArray(messages) || messages.length === 0) {
        return res.status(400).json({ error: "messages array is required" });
      }

      if (!apiKey) {
        return res.status(500).json({ error: "GEMINI_API_KEY environment variable is not configured on the server." });
      }

      const systemInstruction = `أنت "مستشار الأحياء التفاعلي 🧬" الخبير لشهادة الثانوية العامة المصرية (الصف الثالث الثانوي - علمي علوم).
مهمتك:
1. إجابة أسئلة الطلاب في منهج الأحياء كاملاً (الدعامة والحركة، التنسيق الهرموني، التكاثر، المناعة، البيولوجيا الجزيئية - DNA & RNA وتخليق البروتين).
2. الشرح بأسلوب تفاعلي، مشجع، مبسط، ودقيق علمياً يراعي نظام امتحانات الوزارة الحديث (النظام الجديد القائم على الفهم والتحليل والتطبيق).
3. توضيح التريكات والمفاهيم المغلوطة ومغالطات الأسئلة الشائعة في الامتحانات.
4. حساب القوانين والمسائل الرياضية في الأحياء (مثل القطع العضلية، روابط الـ Z-lines، أشرطة الـ DNA، الكودونات والروابط الببتيدية، عدد الوصلات العصبية العضلية) بأسلوب منسق وخطوات واضحة.
5. استخدام تنسيق Markdown خفيف (نقاط، خط عريض) لتوضيح المعلومات وتسهيل القراءة.
6. إذا كان الطالب يدرس محاضرة معينة في التطبيق: [${currentLectureContext || "منهج الأحياء العام"}]، استخدم سياق المحاضرة لربط الإجابة بأفكار تلك المحاضرة.

اجعل إجاباتك ودودة، علمية، مركزة ومباشرة دون مطّ أو تكرار.`;

      // Formulate formatted contents array for Gemini chat
      const formattedContents = messages.map((m: { role: string; content: string }) => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.content }]
      }));

      const response = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: formattedContents,
        config: {
          systemInstruction,
          temperature: 0.7,
        }
      });

      const reply = response.text || "عذراً، لم أستطع توليد الإجابة بشكل صحيح. يرجى المحاولة مرة أخرى.";

      res.json({ reply });
    } catch (error: any) {
      console.error("Error in AI Chatbot endpoint:", error);
      res.status(500).json({ error: error.message || "Failed to get chatbot response" });
    }
  });

  // Vite middleware setup
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
