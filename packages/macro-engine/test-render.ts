import fs from 'fs';
import path from 'path';
import { renderMetamorfitPdf } from './src/renderer';

async function main() {
  console.log('1. Constructing Mock Payload...');
  const mockPayload = {
    fullName: 'Alejandro Hardgainer',
    identity: {
      name: 'Alejandro Hardgainer',
      bodyType: 'Ectomorph',
      goal: 'Muscle Gain'
    },
    metabolicProfile: {
      proteinGrams: 165,
      carbsGrams: 380,
      fatsGrams: 85,
      targetKcal: 2945,
      tdee: 2445
    },
    personalization: {
      personalizationScore: 98
    },
    intelligenceNotes: [
      {
        category: 'optimization',
        title: 'Ectomorph Caloric Surplus',
        description: 'Tu metabolismo acelerado requiere un excedente agresivo. No te saltes comidas.',
        whyThisMatters: 'Los ectomorfos queman calorías en reposo a un ritmo mayor.',
        howToApplyToday: 'Añade calorías líquidas si te sientes lleno.'
      }
    ],
    meals: [
      {
        name: 'Desayuno Constructor',
        ingredients: [
          { name: 'Huevos enteros', amount: '3', unit: 'grandes', calories: 210, protein: 18, carbs: 0, fats: 15 },
          { name: 'Claras de huevo', amount: '100', unit: 'g', calories: 50, protein: 11, carbs: 0, fats: 0 },
          { name: 'Avena', amount: '80', unit: 'g', calories: 310, protein: 11, carbs: 54, fats: 5 }
        ]
      },
      {
        name: 'Almuerzo Denso',
        ingredients: [
          { name: 'Pechuga de pollo', amount: '150', unit: 'g', calories: 248, protein: 46, carbs: 0, fats: 5 },
          { name: 'Quinoa', amount: '120', unit: 'g (seco)', calories: 440, protein: 16, carbs: 76, fats: 7 },
          { name: 'Espinacas frescas', amount: '2', unit: 'tazas', calories: 14, protein: 2, carbs: 2, fats: 0 },
          { name: 'Queso Feta', amount: '30', unit: 'g', calories: 75, protein: 4, carbs: 1, fats: 6 }
        ]
      }
    ],
    explanation: `MANDATORY LANGUAGE RULE: You MUST write the string values of paragraph1, paragraph2, and paragraph3 entirely in fluent, masculine, motivating Castilian Spanish...

Este perfil metabólico ha sido calibrado de manera precisa y milimétrica para tu fisiología ectomorfa. Entendemos que construir músculo para un hardgainer como tú no se trata de comer menos, sino de inundar tu sistema con un excedente de energía anabólica agresivo para vencer tu rápida tasa metabólica en reposo. Las 2945 calorías son innegociables para obligar a tu cuerpo a sintetizar tejido nuevo.

Para apoyar esto, tu asimilación de proteínas está maximizada para evitar el catabolismo, mientras que la densa distribución de energía apoya tu recuperación. Integrar alimentos de altísimo valor biológico y densidad calórica será tu ventaja táctica: la quinoa te brindará carbohidratos complejos y proteína completa; las espinacas frescas aportarán los nitratos esenciales para el rendimiento, y el queso feta añadirá el balance de sodio y grasas saludables clave para las contracciones musculares pesadas.

El camino requiere consistencia extrema. Cada comida es un paso hacia la transformación radical de tu estructura. Tienes el sistema exacto que tu biología necesita; ahora ejecuta el trabajo con una disciplina implacable y no retrocedas.`,
    delivered: {
      timestamp: new Date().toISOString(),
      pdfUrl: ''
    }
  };

  console.log('2. Rendering HTML...');
  const gotenbergEnv = { GOTENBERG_URL: "https://gotenberg-alpha-15308390055.us-central1.run.app" };
  
  // NOTE: renderMetamorfitPdf fetches directly to Gotenberg. Let's intercept the HTML or just let it run.
  // Actually, wait, renderMetamorfitPdf executes the fetch and returns a ReadableStream.
  // BUT the user asked us to "ensure we are passing a form parameter for waitDelay (set to something safe like 2000ms)".
  // Our renderer.tsx doesn't have it currently. Let me patch renderer.tsx to include waitDelay first, then run this.
  
  try {
    const stream = await renderMetamorfitPdf(mockPayload as any, gotenbergEnv);
    console.log('4. Saving Local Output...');
    const outPath = path.join(process.cwd(), '..', '..', 'test-transformation-plan-es.pdf');
    const writeStream = fs.createWriteStream(outPath);
    
    // Convert ReadableStream to Node stream
    // @ts-ignore
    const reader = stream.getReader();
    const pump = async () => {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        writeStream.write(Buffer.from(value));
      }
      writeStream.end();
    };
    await pump();
    console.log('✅ PDF saved successfully to:', outPath);
  } catch (err) {
    console.error('❌ Failed to generate PDF:', err);
  }
}

main();
