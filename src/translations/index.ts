import { Language } from '../context/LanguageContext';

// UI Strings Dictionary
export const translations: Record<string, { ar: string; en: string }> = {
  // Navigation & Headers
  courseTitle: {
    ar: 'كورس المراجعة النهائية المكثف في الأحياء',
    en: 'Intensive Final Biology Revision Course'
  },
  courseSubtitle: {
    ar: 'منصة تفاعلية ذكية مصممة خصيصاً لطلاب الثانوية العامة للتمرس على التفكير المفاهيمي، وحل تريكات المنحنيات والربط بين الفصول وفقاً لنمط امتحانات الوزارة للأعوام 2021-2025.',
    en: 'Smart interactive platform designed for Thanaweya Amma students to master conceptual thinking, curve analytics, and cross-chapter connections per Ministry Exam standards.'
  },
  intensiveLecturesBadge: {
    ar: '06 محاضرات مكثفة',
    en: '06 Intensive Lectures'
  },
  tricksCoverageBadge: {
    ar: '100% تغطية تريكات',
    en: '100% Exam Tricks Covered'
  },
  interactiveSimulationBadge: {
    ar: 'تفاعلي - محاكاة ومنحنيات',
    en: 'Interactive - Simulations & Curves'
  },

  // Top Bar Actions
  daylightMode: {
    ar: 'الوضع المضيء (Daylight)',
    en: 'Daylight Mode'
  },
  nightMode: {
    ar: 'الوضع الليلي (Elegant Dark)',
    en: 'Elegant Dark Mode'
  },
  offlineActive: {
    ar: 'الوضع الأوفلاين (شغّال)',
    en: 'Offline Mode Active'
  },
  offlineReady: {
    ar: 'جاهز للأوفلاين ✓',
    en: 'Offline Ready ✓'
  },
  studyRemindersBtn: {
    ar: 'تنبيهات المذاكرة',
    en: 'Study Reminders'
  },
  aiAdvisorBtn: {
    ar: 'مستشار الأحياء الذكي',
    en: 'AI Biology Advisor'
  },
  conceptMapBtn: {
    ar: 'خريطة المفاهيم D3',
    en: 'D3 Concept Map'
  },
  guidanceModelBtn: {
    ar: 'النموذج الاسترشادي 2026',
    en: '2026 Guidance Model'
  },
  officialBadge: {
    ar: 'رسمي',
    en: 'OFFICIAL'
  },
  switchLanguageBtn: {
    ar: '🌐 English',
    en: '🌐 العربية'
  },

  // Search Bar
  searchPlaceholder: {
    ar: 'ابحث عن مفهوم، تريكة، أو تحدث بالميكروفون...',
    en: 'Search concept, exam trick, or speak into microphone...'
  },
  searchListeningPlaceholder: {
    ar: 'جاري الاستماع... تحدث بالمفهوم الآن...',
    en: 'Listening... Speak your topic now...'
  },
  clearSearch: {
    ar: 'مسح',
    en: 'Clear'
  },
  voiceSearchBtn: {
    ar: 'صوتي 🎙️',
    en: 'Voice 🎙️'
  },
  stopVoiceBtn: {
    ar: 'إيقاف',
    en: 'Stop'
  },

  // Main Tabs
  tabConcepts: {
    ar: 'المفاهيم الشاملة',
    en: 'Key Concepts'
  },
  tabVisualTools: {
    ar: 'النماذج البصرية التفاعلية',
    en: 'Interactive Visual Models'
  },
  tabTricks: {
    ar: 'التريكات والربط بين الفصول',
    en: 'Exam Tricks & Links'
  },
  tabQuestionBank: {
    ar: 'بنك أسئلة الوزارة',
    en: 'Ministry Question Bank'
  },
  tabDailyTrick: {
    ar: 'التحدي اليومي',
    en: 'Daily Challenge'
  },
  tabFormulasSheet: {
    ar: 'ملخص القوانين والمسائل',
    en: 'Formulas & Equations'
  },
  tabMistakeBank: {
    ar: 'بنك الأخطاء المستهدفة',
    en: 'Targeted Mistake Bank'
  },
  tabMockExam: {
    ar: 'الامتحان الشامل المحاكي',
    en: 'Full Mock Exam'
  },
  tabPastExams: {
    ar: 'امتحانات مصر السابقة (2021-2025)',
    en: 'Egypt Past Exams (2021-2025)'
  },
  tabGlobalAnalytics: {
    ar: 'تحليلات الأداء الشاملة',
    en: 'Global Performance Analytics'
  },
  tabBubbleSheet: {
    ar: 'امتحان البابل شيت 2026',
    en: '2026 Bubble Sheet Exam'
  },

  // Lecture Titles
  lecture1Title: {
    ar: 'الدعامة والحركة في الكائنات الحية',
    en: 'Support & Movement in Living Organisms'
  },
  lecture2Title: {
    ar: 'التنسيق الهرموني في الكائنات الحية',
    en: 'Hormonal Coordination in Living Organisms'
  },
  lecture3Title: {
    ar: 'التكاثر وتعاقب الأجيال في الكائنات الحية',
    en: 'Reproduction & Alternation of Generations'
  },
  lecture4Title: {
    ar: 'التكاثر في الإنسان وتكنولوجيا الإخصاب',
    en: 'Human Reproduction & Reproductive Tech'
  },
  lecture5Title: {
    ar: 'المناعة في الكائنات الحية وآليات الدفاع',
    en: 'Immunity & Defense Mechanisms in Living Organisms'
  },
  lecture6Title: {
    ar: 'البيولوجيا الجزيئية و DNA/RNA والهندسة الوراثية',
    en: 'Molecular Biology, DNA/RNA & Genetic Engineering'
  },

  // Common Controls & Buttons
  lecturePrefix: {
    ar: 'المحاضرة',
    en: 'Lecture'
  },
  readingMode: {
    ar: 'وضع القراءة',
    en: 'Reading Mode'
  },
  exitReadingMode: {
    ar: 'الخروج من وضع القراءة',
    en: 'Exit Reading Mode'
  },
  fullscreen: {
    ar: 'ملء الشاشة',
    en: 'Fullscreen'
  },
  exitFullscreen: {
    ar: 'تصغير الشاشة',
    en: 'Exit Fullscreen'
  },
  themeClassic: {
    ar: 'كلاسيكي داكن',
    en: 'Classic Dark'
  },
  themeDaylight: {
    ar: 'نهار ناصع',
    en: 'Daylight Light'
  },
  themeSepia: {
    ar: 'سيبيا دافئ',
    en: 'Warm Sepia'
  },
  themeEmerald: {
    ar: 'زمردي مكتبي',
    en: 'Midnight Emerald'
  },
  fontSize: {
    ar: 'حجم الخط:',
    en: 'Font Size:'
  },
  fontFamily: {
    ar: 'نوع الخط:',
    en: 'Font Family:'
  },
  maxWidth: {
    ar: 'عرض النص:',
    en: 'Max Width:'
  },
  lineHeight: {
    ar: 'ارتفاع السطر:',
    en: 'Line Height:'
  },
  submitAnswer: {
    ar: 'تأكيد الإجابة',
    en: 'Submit Answer'
  },
  nextQuestion: {
    ar: 'السؤال التالي',
    en: 'Next Question'
  },
  prevQuestion: {
    ar: 'السؤال السابق',
    en: 'Previous Question'
  },
  showExplanation: {
    ar: 'تفسير الإجابة النموذجية',
    en: 'Model Answer Explanation'
  },
  hideExplanation: {
    ar: 'إخفاء التفسير',
    en: 'Hide Explanation'
  },
  correctAnswerBadge: {
    ar: 'إجابة صحيحة! أحسنت 🎉',
    en: 'Correct Answer! Great Job 🎉'
  },
  wrongAnswerBadge: {
    ar: 'إجابة خاطئة! راجع التفسير العلمي ⚠️',
    en: 'Incorrect Answer! Review Explanation ⚠️'
  },
  saveToMistakes: {
    ar: 'حفظ في بنك الأخطاء',
    en: 'Save to Mistake Bank'
  },
  savedToMistakes: {
    ar: 'تم الحفظ في بنك الأخطاء ✓',
    en: 'Saved to Mistake Bank ✓'
  },
  quickQuestionsHeader: {
    ar: 'أسئلة وتطبيقات مفاهيمية سريعة:',
    en: 'Quick Conceptual Questions & Applications:'
  },
  keyPointsHeader: {
    ar: 'مفاتيح استذكار ونقاط حاسمة:',
    en: 'Key Review Points & Crucial Takeaways:'
  },
  showAnswer: {
    ar: 'عرض الإجابة والتعليل العلمي',
    en: 'Show Answer & Reasoning'
  },
  hideAnswer: {
    ar: 'إخفاء الإجابة',
    en: 'Hide Answer'
  },
  noResultsFound: {
    ar: 'لم يتم العثور على نتائج تطابق البحث.',
    en: 'No matching results found.'
  },
  resetFilter: {
    ar: 'إعادة تعيين البحث',
    en: 'Reset Search'
  },

  // Modals Titles
  biologyChatbotTitle: {
    ar: 'مستشار الأحياء الذكي (AI Biology Advisor)',
    en: 'AI Biology Advisor (Smart Chatbot)'
  },
  studyRemindersTitle: {
    ar: 'جدول تنبيهات المذاكرة والتكرار المتباعد',
    en: 'Study Reminders & Spaced Repetition Schedule'
  },
  floatingFormulaTitle: {
    ar: 'نافذة المسائل والقوانين العائمة',
    en: 'Floating Formulas & Calculations Window'
  },

  // Flashcards Controls
  flashcardTitle: {
    ar: 'بطاقة استذكار تفاعلية (Flashcard)',
    en: 'Interactive Flashcard'
  },
  clickToFlip: {
    ar: 'اضغط لقلب البطاقة ومعرفة الإجابة النموذجية',
    en: 'Click card to flip and reveal model answer'
  },
  masteredBtn: {
    ar: 'أتقنتها 👍',
    en: 'Mastered 👍'
  },
  needReviewBtn: {
    ar: 'تحتاج مراجعة 🔁',
    en: 'Needs Review 🔁'
  },
  cardCounter: {
    ar: 'بطاقة',
    en: 'Card'
  },
  of: {
    ar: 'من',
    en: 'of'
  }
};

import { autoTranslateText } from '../utils/autoTranslator';

export const getTranslation = (key: string, lang: Language): string => {
  if (translations[key]) {
    return translations[key][lang] || translations[key]['ar'];
  }
  return key;
};

// Data localization helper function
export const getLocalized = (ar: string | undefined, en: string | undefined, lang: Language): string => {
  if (lang === 'en') {
    if (en && en.trim().length > 0) return en;
    if (ar) return autoTranslateText(ar);
  }
  return ar || en || '';
};

// Array localization helper
export const getLocalizedArray = (arArr: string[] | undefined, enArr: string[] | undefined, lang: Language): string[] => {
  if (lang === 'en') {
    if (enArr && enArr.length > 0) return enArr;
    if (arArr) return arArr.map(item => autoTranslateText(item));
  }
  return arArr || enArr || [];
};

// MCQ Options localization helper
export const getLocalizedOption = (
  options: { A: string; B: string; C: string; D: string },
  optionsEn: { A?: string; B?: string; C?: string; D?: string } | undefined,
  key: 'A' | 'B' | 'C' | 'D',
  lang: Language
): string => {
  if (lang === 'en') {
    if (optionsEn && optionsEn[key] && optionsEn[key]!.trim().length > 0) {
      return optionsEn[key]!;
    }
    if (options && options[key]) {
      return autoTranslateText(options[key]);
    }
  }
  return options[key] || '';
};

// MCQ Explanation localization helper
export const getLocalizedExplanation = (
  explanation: { correct: string; incorrectA?: string; incorrectB?: string; incorrectC?: string; incorrectD?: string },
  explanationEn: { correct?: string; incorrectA?: string; incorrectB?: string; incorrectC?: string; incorrectD?: string } | undefined,
  key: 'correct' | 'incorrectA' | 'incorrectB' | 'incorrectC' | 'incorrectD',
  lang: Language
): string => {
  if (lang === 'en') {
    if (explanationEn && explanationEn[key] && explanationEn[key]!.trim().length > 0) {
      return explanationEn[key]!;
    }
    if (explanation && explanation[key]) {
      return autoTranslateText(explanation[key]);
    }
  }
  return explanation[key] || '';
};

// Lecture Title Localizer
export const getLectureTitle = (lecture: { id: number; title: string; arabicTitle: string }, lang: Language): string => {
  if (lang === 'en') {
    return `Lecture ${lecture.id}: ${lecture.title || autoTranslateText(lecture.arabicTitle)}`;
  }
  return `المحاضرة ${lecture.id}: ${lecture.arabicTitle}`;
};
