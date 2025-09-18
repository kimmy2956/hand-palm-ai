import express from "express";
import bodyParser from "body-parser";
import fetch from "node-fetch";
import multer from "multer";
import fs from "fs";
import cors from "cors";

const app = express();
const upload = multer({ dest: "uploads/" });

app.use(cors()); // ให้ frontend เรียกได้
app.use(bodyParser.json());

const API_KEY = process.env.GEMINI_API_KEY;

app.post("/analyze", upload.single("palm"), async (req, res) => {
  try {
    const filePath = req.file.path;
    const base64Data = fs.readFileSync(filePath, { encoding: "base64" });
    fs.unlinkSync(filePath);

    const prompt = `
      จากรูปภาพฝ่ามือนี้ ทำนายดวงชะตาโดยอิงจากศาสตร์ลายมือ
      วิเคราะห์ 4 เส้นหลัก: **เส้นชีวิต**, **เส้นสมอง**, **เส้นหัวใจ**, และ **เส้นวาสนา**
      แต่ละเส้นให้เขียนคำทำนายเชิงบวก
      ตอบเป็นภาษาไทยเท่านั้น
    `;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            { role: "user", parts: [{ text: prompt }] },
            {
              role: "user",
              parts: [
                { inlineData: { data: base64Data, mimeType: req.file.mimetype } },
              ],
            },
          ],
        }),
      }
    );

    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || "ไม่พบคำตอบ";
    res.json({ result: text });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "เกิดข้อผิดพลาด" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
