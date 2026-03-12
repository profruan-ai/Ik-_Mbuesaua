import express from "express";
import { createServer as createViteServer } from "vite";
import multer from "multer";
import { PDFParse } from "pdf-parse";
import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createRequire } from "module";
import OpenAI from "openai";
import "dotenv/config";

const require = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

// Configure multer for file uploads
const upload = multer({ storage: multer.memoryStorage() });

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

app.post("/api/adapt-questions", async (req, res) => {
  const { questions } = req.body;
  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: "Chave API Groq não configurada no servidor." });
  }

  const client = new OpenAI({
    apiKey,
    baseURL: "https://api.groq.com/openai/v1",
  });

  const prompt = `Você é um especialista em educação intercultural indígena da Amazônia.
Sua missão é transformar questões educacionais tradicionais em questões com contexto indígena amazônico autêntico.

ELEMENTOS CULTURAIS OBRIGATÓRIOS (use-os para criar os cenários):
- Flechas, arcos, barcos, canoas, remos.
- Rios (Amazonas, Tapajós, Solimões), igapós, igarapés.
- Preservação da natureza, floresta em pé, castanhais, açaizais.
- Comunidade, aldeia (itinerante ou fixa), maloca, casa de farinha.
- Peixes (tucunaré, pirarucu, tambaqui), caça sustentável.
- Frutas da floresta (cupuaçu, bacuri, buriti, açaí).
- Personagens: Curumins, cunhantãs, pajés, caciques, anciãos.

REGRAS DE OURO:
1. NUNCA altere os números, valores, dados estatísticos ou o objetivo matemático/pedagógico da questão.
2. Substitua cenários urbanos (cidades, fábricas, cinemas, bancos, lojas) por cenários da floresta e da aldeia.
3. Substitua profissões urbanas (engenheiros, arquitetos, gerentes) por papéis da comunidade (mestres construtores, artesãos, líderes comunitários).
4. O resultado deve ser um texto fluido e natural, como se a questão tivesse sido escrita originalmente por um professor indígena.
5. NÃO repita o texto da questão original, retorne apenas a versão transformada.
6. Mantenha a formatação original das alternativas (A, B, C, D, E) se houver, sem adicionar quebras de linha extras no meio do texto da questão.
7. NÃO adicione prefixos como "Questão 1:", "Questão 2:", etc. Mantenha apenas a numeração original da questão se ela já existir no texto original.

Questões para transformar:
${questions.map((q: string) => `${q}`).join('\n\n---\n\n')}

Retorne um objeto JSON com a chave "questions" contendo um array de strings com as questões transformadas.`;

  try {
    const response = await client.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: "Você é um assistente que responde apenas em formato JSON." },
        { role: "user", content: prompt }
      ],
      temperature: 0.5,
      response_format: { type: "json_object" }
    });

    const content = response.choices[0].message.content || "{}";
    const result = JSON.parse(content);
    res.json({ questions: result.questions || questions });
  } catch (error: any) {
    console.error("Groq AI Error:", error);
    res.status(500).json({ error: `Erro na IA (Groq): ${error.message || "Falha ao contextualizar questões"}` });
  }
});

function extractQuestions(text: string) {
  // Try to split by common question markers (1., 1), Question 1, etc.)
  // We look for numbers at the start of lines or after double newlines
  const questions = text.split(/(?:\n\s*\n|\n|^)\s*(?=[a-zA-Z]*\s*\d+[\.\)\-\s])/);
  return questions.map(q => q.trim()).filter(q => q && q.length > 10);
}

function generateFramework() {
  return `FUNDAMENTAÇÃO PEDAGÓGICA INTERCULTURAL (AMAZÔNIA)

Base Nacional Comum Curricular (BNCC):
Este material foi elaborado em conformidade com as competências gerais da BNCC, com foco na realidade amazônica:
- Competência 1: Conhecimento - Valorizar saberes tradicionais dos povos da floresta.
- Competência 2: Pensamento crítico - Investigar fenômenos naturais e sociais do território.
- Competência 6: Trabalho e projeto de vida - Valorizar a economia da floresta em pé.
- Competência 9: Empatia e cooperação - Exercitar o diálogo intercultural e a gestão comunitária.

Taxonomia de Bloom - Níveis Cognitivos:
- Lembrar: Identificar elementos da fauna, flora e cultura local.
- Compreender: Interpretar problemas em contextos de pesca, roça e coleta.
- Aplicar: Resolver situações-problema com dados da realidade da aldeia.
- Analisar: Comparar dinâmicas territoriais e ambientais.

Justificativa Intercultural Amazônica:
A educação escolar indígena na Amazônia exige materiais que falem a língua da realidade local. Ao utilizar contextos como o manejo do pirarucu, a coleta do açaí ou a construção de canoas, transformamos a matemática e outras ciências em ferramentas de afirmação identitária e resistência cultural.`;
}

function generateComparativeAnalysis(originalQuestions: string[], adaptedQuestions: string[]) {
  let analysis = "ANÁLISE COMPARATIVA DA TRANSFORMAÇÃO\n\n";
  analysis += "Ruptura Epistemológica:\n";
  analysis += "Este material propõe uma transformação epistemológica ao substituir contextos urbanos/ocidentais por cenários que reflectem a realidade sociocultural indígena. Esta adaptação não altera os dados numéricos ou o raciocínio matemático necessário, mas modifica o universo semântico para promover identificação e relevância cultural.\n\n";
  analysis += "Comparação Questão por Questão:\n\n";
  
  const maxLength = Math.max(originalQuestions?.length || 0, adaptedQuestions?.length || 0);
  for (let i = 0; i < maxLength; i++) {
    analysis += `Item ${i+1}:\n`;
    const orig = originalQuestions?.[i] || "";
    const adapt = adaptedQuestions?.[i] || "";
    analysis += `  Original: ${orig.substring(0, 100)}...\n`;
    analysis += `  Adaptada: ${adapt.substring(0, 100)}...\n\n`;
  }
  
  analysis += "Valor Pedagógico:\n";
  analysis += "- Promove identificação cultural do estudante\n";
  analysis += "- Fortalece a conexão entre conhecimento matemático e realidade local\n";
  analysis += "- Desenvolve pensamento crítico sobre diferentes contextos sociais\n";
  analysis += "- Valoriza saberes e modos de vida indígenas\n";
  
  return analysis;
}

function generateLessonPlan() {
  return `PLANO DE AULA: MATEMÁTICA E SABERES DA FLORESTA

1. DADOS DA AULA
- Tema: Matemática no Cotidiano da Aldeia
- Público: Ensino Fundamental (Anos Finais)
- Contexto: Realidade Indígena Amazônica

2. OBJETIVOS
- Resolver problemas matemáticos utilizando cenários da vida na floresta.
- Refletir sobre a importância dos recursos naturais (rios, peixes, frutos).
- Fortalecer o vocabulário e a identidade cultural através de questões contextualizadas.

3. METODOLOGIA (RODA DE SABERES)
a) Momento Inicial (10 min): Conversa sobre como usamos a matemática na pesca, na roça ou na construção de uma maloca.
b) Desenvolvimento (25 min): Resolução das questões adaptadas. Discussão sobre os elementos culturais presentes (canoas, flechas, curumins).
c) Atividade Criativa (10 min): Os alunos devem criar uma nova questão baseada em um acontecimento recente na aldeia.
d) Fechamento (5 min): Partilha das soluções e reflexão sobre a "Matemática da Floresta".

4. RECURSOS
- Questões contextualizadas (PDF gerado).
- Materiais concretos (seeds, sticks) para auxílio nos cálculos, se necessário.

5. AVALIAÇÃO
- Observação da participação e do raciocínio lógico aplicado aos contextos tradicionais.`;
}

app.post('/api/extract', upload.any(), async (req, res) => {
  const files = (req as any).files || [];
  const file = files.find((f: any) => f.fieldname === 'file');
  const bodyText = req.body.text;

  console.log('Extract request received:', { 
    hasFile: !!file, 
    fileType: file?.mimetype,
    hasText: !!bodyText
  });

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
    res.json({ questions: questions.length > 0 ? questions : [textContent] });
  } catch (error) {
    console.error('Extract Error:', error);
    res.status(500).json({ error: "Erro ao extrair texto." });
  }
});

app.post('/api/generate-pdf', async (req, res) => {
  const { originalQuestions, adaptedQuestions } = req.body;

  if (!originalQuestions || !adaptedQuestions) {
    return res.status(400).json({ error: "Dados insuficientes para gerar PDF." });
  }

  let doc: any;
  try {
    req.on('error', (err) => {
      console.error('Request Stream Error:', err);
    });

    // Generate PDF
    const CM_TO_PT = 72 / 2.54;
    const margin2cm = 2 * CM_TO_PT;

    doc = new PDFDocument({ 
      margins: { 
        top: margin2cm, 
        bottom: margin2cm, 
        left: margin2cm, 
        right: margin2cm 
      }, 
      autoFirstPage: false 
    });
    
    doc.on('error', (err) => {
      console.error('PDF Generation Error:', err);
      if (!res.headersSent) {
        res.status(500).json({ error: "Erro ao gerar o PDF." });
      } else {
        res.end();
      }
    });

    res.on('error', (err) => {
      console.error('Response Stream Error:', err);
      try { doc.end(); } catch (e) {}
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=questoes_contextualizadas.pdf');
    
    doc.pipe(res);
    
    // Helper to add header and footer
    const addHeaderFooter = (pageNo: number) => {
      // Save current state
      const oldX = doc.x;
      const oldY = doc.y;
      const oldBottomMargin = doc.page.margins.bottom;
      
      // Temporarily remove bottom margin to prevent recursion
      doc.page.margins.bottom = 0;
      
      doc.save();
      
      // Header
      doc.rect(0, 0, doc.page.width, 25).fill('#0066cc');
      doc.rect(0, 25, doc.page.width, 2).fill('#3399ff');
      
      // Footer
      doc.rect(0, doc.page.height - 25, doc.page.width, 25).fill('#0066cc');
      doc.rect(0, doc.page.height - 27, doc.page.width, 2).fill('#3399ff');
      
      doc.fillColor('#ffffff').fontSize(8).text(`Página ${pageNo}`, 0, doc.page.height - 15, { 
        align: 'center',
        width: doc.page.width,
        lineBreak: false
      });
      
      // Restore state
      doc.restore();
      
      // Restore margins and cursor position
      doc.page.margins.bottom = oldBottomMargin;
      doc.x = oldX;
      doc.y = oldY;
    };
    
    let pageCount = 1;
    
    doc.on('pageAdded', () => {
      addHeaderFooter(pageCount++);
    });
    
    // Page 1: Questions
    doc.addPage();
    doc.font('Helvetica-Bold').fontSize(18).fillColor('#003366').text("Exercícios Contextualizados - Contexto Indígena", { align: 'left' });
    doc.moveDown(0.5);
    
    doc.font('Helvetica').fontSize(12).fillColor('#000000').text("Questões adaptadas para contexto intercultural indígena, preservando o rigor matemático e os dados numéricos originais.");
    doc.moveDown(1);
    
    for (let i = 0; i < adaptedQuestions.length; i++) {
      doc.font('Helvetica').fontSize(11).fillColor('#000000').text(adaptedQuestions[i]);
      doc.moveDown(1.2);
    }
    
    // Page 2: Framework
    doc.addPage();
    doc.font('Helvetica-Bold').fontSize(16).fillColor('#003366').text("FUNDAMENTAÇÃO PEDAGÓGICA INTERCULTURAL (AMAZÔNIA)", { align: 'left' });
    doc.moveDown(0.5);
    doc.font('Helvetica').fontSize(11).fillColor('#000000').text(generateFramework());
    
    // Page 3: Comparative Analysis
    doc.addPage();
    doc.font('Helvetica-Bold').fontSize(16).fillColor('#003366').text("ANÁLISE COMPARATIVA DA TRANSFORMAÇÃO", { align: 'left' });
    doc.moveDown(0.5);
    doc.font('Helvetica').fontSize(11).fillColor('#000000').text(generateComparativeAnalysis(originalQuestions, adaptedQuestions));
    
    // Page 4: Lesson Plan
    doc.addPage();
    doc.font('Helvetica-Bold').fontSize(16).fillColor('#003366').text("PLANO DE AULA: MATEMÁTICA E SABERES DA FLORESTA", { align: 'left' });
    doc.moveDown(0.5);
    doc.font('Helvetica').fontSize(11).fillColor('#000000').text(generateLessonPlan());
    
    doc.end();
  } catch (error) {
    console.error('PDF Error:', error);
    try { if (doc) doc.unpipe(res); } catch (e) {}
    if (!res.headersSent) {
      res.status(500).json({ error: "Erro ao gerar PDF." });
    } else {
      res.end();
    }
  }
});

async function startServer() {
  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.resolve(__dirname, "dist", "index.html"));
    });
  }

  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('Global Error:', err);
    if (!res.headersSent) {
      res.status(500).json({ error: err.message || 'Internal Server Error' });
    }
  });

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
