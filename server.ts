import 'dotenv/config';
import express from "express";
import multer from "multer";
import PDFDocument from "pdfkit";
import cors from 'cors';
import { PDFParse } from "pdf-parse";

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(cors({ origin: '*' }));

// Upload
const upload = multer({ storage: multer.memoryStorage() });

// ================= FUNÇÕES =================

function extractQuestions(text: string) {
  const questions = text.split(/(?:\n\s*\n|\n|^)\s*(?=[a-zA-Z]*\s*\d+[\.\)\-\s])/);
  return questions.map(q => q.trim()).filter(q => q && q.length > 10);
}

// ================= ROTAS =================

app.get("/", (req, res) => {
  res.send("API rodando 🚀");
});

// EXTRAIR TEXTO
app.post('/api/extract', upload.any(), async (req, res) => {
  const files = (req as any).files || [];
  const file = files.find((f: any) => f.fieldname === 'file');
  const bodyText = req.body.text;

  try {
    let textContent = "";

    if (file) {
      if (file.mimetype === 'application/pdf') {
        const parser = new PDFParse({ data: file.buffer });
        const data = await parser.getText();
        textContent = data.text;
      } else {
        textContent = file.buffer.toString('utf-8');
      }
    } else if (bodyText) {
      textContent = bodyText;
    }

    if (!textContent.trim()) {
      return res.status(400).json({ error: "Nenhum conteúdo encontrado." });
    }

    const questions = extractQuestions(textContent);
    res.json({ questions });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao extrair texto." });
  }
});

// GERAR PDF
app.post('/api/generate-pdf', async (req, res) => {
  const { adaptedQuestions } = req.body;

  if (!adaptedQuestions) {
    return res.status(400).json({ error: "Dados insuficientes." });
  }

  try {
    const doc = new PDFDocument();

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=arquivo.pdf');

    doc.pipe(res);

    doc.fontSize(16).text("Exercícios Contextualizados", { align: 'center' });
    doc.moveDown();

    adaptedQuestions.forEach((q: string) => {
      doc.fontSize(12).text(q);
      doc.moveDown();
    });

    doc.end();

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao gerar PDF." });
  }
});

// ================= START =================

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});