import { MCQQuestion, MistakeItem } from '../types';

const STORAGE_KEY = 'thanaweya_mistake_bank';

export function getMistakeBank(): MistakeItem[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.error('Error reading mistake bank:', e);
  }
  return [];
}

export function saveMistakeBank(items: MistakeItem[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch (e) {
    console.error('Error saving mistake bank:', e);
  }
}

export function recordMistake(
  question: MCQQuestion,
  wrongChoice: string,
  lectureId: number = 1,
  lectureTitle: string = 'الأحياء - الثانوية العامة'
): void {
  const currentBank = getMistakeBank();
  const existingIdx = currentBank.findIndex(item => item.id === question.id);

  const timestamp = new Date().toLocaleDateString('ar-EG', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });

  if (existingIdx >= 0) {
    // Update existing item
    currentBank[existingIdx] = {
      ...currentBank[existingIdx],
      wrongAnswerChosen: wrongChoice,
      timestamp,
      attemptCount: (currentBank[existingIdx].attemptCount || 1) + 1,
      mastered: false // Re-marked as needing review if answered wrong again
    };
  } else {
    // Add new item
    const newItem: MistakeItem = {
      id: question.id,
      question,
      wrongAnswerChosen: wrongChoice,
      lectureId,
      lectureTitle,
      timestamp,
      attemptCount: 1,
      mastered: false
    };
    currentBank.unshift(newItem);
  }

  saveMistakeBank(currentBank);
}

export function markMistakeAsMastered(questionId: string): void {
  const currentBank = getMistakeBank();
  const updated = currentBank.map(item => {
    if (item.id === questionId) {
      return { ...item, mastered: true };
    }
    return item;
  });
  saveMistakeBank(updated);
}

export function recordDiagramLabelMistake(
  diagramTitle: string,
  targetPartName: string,
  targetPartId: string,
  wrongLabelPlacedName: string,
  partDescription: string,
  lectureId: number = 1,
  lectureTitle: string = 'الشروحات البصرية - التسميات والتوضيحات'
): void {
  const currentBank = getMistakeBank();
  const mistakeId = `diagram-${diagramTitle.replace(/\s+/g, '-')}-${targetPartId}`;
  const existingIdx = currentBank.findIndex(item => item.id === mistakeId);

  const timestamp = new Date().toLocaleDateString('ar-EG', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });

  const question: MCQQuestion = {
    id: mistakeId,
    questionText: `[رسم توضيحي: ${diagramTitle}] ما هي التسمية الصحيحة للجزء المشار إليه (${targetPartName})؟`,
    options: {
      A: targetPartName,
      B: wrongLabelPlacedName,
      C: 'عضية أو تركيب آخر',
      D: 'غير ذلك'
    },
    correctAnswer: 'A',
    explanation: {
      correct: `التسمية الصحيحة لهذا الموضع هي "${targetPartName}". ${partDescription}`,
      incorrectA: `تم وضع التسمية الخاطئة "${wrongLabelPlacedName}" بدلاً من "${targetPartName}".`
    },
    complexity: 'medium',
    sourceYear: 'اختبار التسميات البصرية'
  };

  if (existingIdx >= 0) {
    const existing = currentBank[existingIdx];
    currentBank[existingIdx] = {
      ...existing,
      wrongAnswerChosen: wrongLabelPlacedName,
      timestamp,
      attemptCount: (existing.attemptCount || 1) + 1,
      mastered: false
    };
  } else {
    const newItem: MistakeItem = {
      id: mistakeId,
      question,
      wrongAnswerChosen: wrongLabelPlacedName,
      lectureId,
      lectureTitle,
      timestamp,
      attemptCount: 1,
      mastered: false
    };
    currentBank.unshift(newItem);
  }

  saveMistakeBank(currentBank);
}

export function DEFAULT_DEMO_MISTAKES(): MistakeItem[] {
  return [
    {
      id: 'demo-err-1',
      question: {
        id: 'demo-err-1',
        questionText: 'أثناء الانقباض العضلي التام، أي المعالم الآتية في القطعة العضلية (الباركومير) تنعدم أو يختفي طولها تقريباً؟',
        options: {
          A: 'المنطقة المضيئة (I)',
          B: 'المنطقة شبه المضيئة (H)',
          C: 'المنطقة الداكنة (A)',
          D: 'الخط الداكن (Z)'
        },
        correctAnswer: 'B',
        explanation: {
          correct: 'المنطقة شبه المضيئة (H) تتكون فقط من خيوط الميوسين، وأثناء الانقباض العضلي التام تنزلق خيوط الأكتين وتقترب من بعضها حتى تنعدم المنطقة H تماماً.',
          incorrectA: 'المنطقة I يقل طولها ولكنها لا تنعدم تماماً في الغالب.',
          incorrectB: 'إجابة خاطئة اخترتها سابقاً: المنطقة A تظل ثابته الطول دائماً لأن خيوط الميوسين لا يتغير طولها.',
          incorrectC: 'المنطقة A يظل طولها ثابتاً لا يتغير إطلاقاً أثناء الانقباض أو الانبساط.',
        },
        complexity: 'medium',
        sourceYear: 'دور أول 2022'
      },
      wrongAnswerChosen: 'C',
      lectureId: 1,
      lectureTitle: 'الفصل الأول: الدعامة والحركة',
      timestamp: '٢٨ يوليو ٢٠٢٦',
      attemptCount: 2,
      mastered: false
    },
    {
      id: 'demo-err-2',
      question: {
        id: 'demo-err-2',
        questionText: 'أي من الهرمونات التالية يزداد إفرازه في حالة انخفاض نسبة صوديوم الدم لإعادة امتصاصه في الكليتين؟',
        options: {
          A: 'الباراثورمون',
          B: 'الألدوستيرون',
          C: 'الكالسيتونين',
          D: 'الفازوبرسين (ADH)'
        },
        correctAnswer: 'B',
        explanation: {
          correct: 'هرمون الألدوستيرون ينظم توازن المعادن بالجسم، فيحفز إعادة امتصاص الصوديوم والتخلص من البوتاسيوم الزائد عن طريق الكليتين.',
          incorrectA: 'الباراثورمون ينظم مستوى الكالسيوم في الدم وليس الصوديوم.',
          incorrectB: 'إجابة خاطئة اخترتها سابقاً: الكالسيتونين يقلل مستوى الكالسيوم في الدم بترسيبه في العظام.',
          incorrectC: 'الكالسيتونين يقلل الكالسيوم وليس الصوديوم.',
        },
        complexity: 'medium',
        sourceYear: 'تجريبي 2023'
      },
      wrongAnswerChosen: 'A',
      lectureId: 2,
      lectureTitle: 'الفصل الثاني: التنسيق الهرموني',
      timestamp: '٢٧ يوليو ٢٠٢٦',
      attemptCount: 1,
      mastered: false
    },
    {
      id: 'demo-err-3',
      question: {
        id: 'demo-err-3',
        questionText: 'في دورة طمث أنثى الإنسان، يحدث التبويض وانطلاق البويضة الثانوية تحت تأثير أعلى قمة لهرمون:',
        options: {
          A: 'الاستروجين',
          B: 'البروجستيرون',
          C: 'الهرمون المنشط للحويصلة (FSH)',
          D: 'الهرمون المصفر (LH)'
        },
        correctAnswer: 'D',
        explanation: {
          correct: 'يصل هرمون LH إلى أعلى مستوياته في اليوم 13-14 من دورة الطمث، مما يؤدي لتمزق حويصلة جراف وانفجارها وانطلاق البويضة الثانوية.',
          incorrectA: 'الاستروجين يصل لقمته قبل التبويض لإنماء بطانة الرحم.',
          incorrectB: 'إجابة خاطئة: البروجستيرون يزداد إفرازه بعد التبويض من الجسم الأصفر.',
          incorrectC: 'FSH ينشط نمو الحويصلة وليس تمزقها.',
        },
        complexity: 'high',
        sourceYear: 'دور ثاني 2023'
      },
      wrongAnswerChosen: 'B',
      lectureId: 3,
      lectureTitle: 'الفصل الثالث: التكاثر في الكائنات الحية',
      timestamp: '٢٩ يوليو ٢٠٢٦',
      attemptCount: 1,
      mastered: false
    }
  ];
}
