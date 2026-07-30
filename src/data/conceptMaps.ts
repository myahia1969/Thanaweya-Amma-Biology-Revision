import { LectureConceptMap, ConceptMapNode, ConceptMapLink } from '../types';

export const lectureConceptMaps: Record<number, { nodes: ConceptMapNode[]; links: ConceptMapLink[] }> = {
  // الفصل الأول: الدعامة والحركة
  1: {
    nodes: [
      {
        id: 'l1-core',
        label: 'الدعامة والحركة',
        category: 'core',
        lectureId: 1,
        description: 'المنظومة المتكاملة التي تضمن الحفاظ على شكل الكائن الحي، حمايته، وتمكينه من الحركة الانتقالية والوضعية.',
        examNote: 'تركز أسئلة الامتحان على التفرقة بين الدعامة الفسيولوجية (مؤقتة ومائية) والدعامة التركيبية (دائمة ومترسبة).'
      },
      {
        id: 'l1-physio',
        label: 'الدعامة الفسيولوجية',
        category: 'concept',
        lectureId: 1,
        description: 'ظاهرة فسيولوجية مؤقتة تعتمد على امتصاص الفجوة العصارية للماء بالخاصية الأسموزية فتنتفخ الخلية وتوتر جدارها.',
        keyPoints: ['تؤثر على الخلية ككل', 'مؤقتة وتعتمد على توافر الماء', 'تأثر بمعدل البخر والنتح وامتصاص الجذر']
      },
      {
        id: 'l1-structural',
        label: 'الدعامة التركيبية',
        category: 'concept',
        lectureId: 1,
        description: 'دعامة دائمة تتناول جدر الخلايا أو أجزاء منها بترسيب مواد صلبة غير نافذة للماء لحمايتها ومنع فقد الماء.',
        keyPoints: ['مواد الترسيب: السيوبرين، الكيوتين، اللجنين، السيليلوز', 'دائمة وتشمل خلايا اسكلرنشيمية وكولنشيمية']
      },
      {
        id: 'l1-sarcomere',
        label: 'القطعة العضلية (الساركومير)',
        category: 'structure',
        lectureId: 1,
        description: 'وحدة الانقباض العضلي المحصورة بين خطين زيكزاك المتجاورين (Z-lines).',
        examNote: 'عند الانقباض: يقل طول I و H و Sarcomere، بينما يظل طول A (المنطقة الداكنة) ثابتاً دون تغيير.'
      },
      {
        id: 'l1-myosin',
        label: 'خيوط المايوسين والروابط المستعرضة',
        category: 'mechanism',
        lectureId: 1,
        description: 'خيوط بروتينية سميكة تمتد منها خطاطيف بروتينية (روابط مستعرضة) بمساعدة أيونات الكالسيوم Ca2+ وتستهلك جزيئات ATP.',
        keyPoints: ['تحتاج Ca2+ للتكوين', 'تحتاج ATP للسحب وATP آخر للفصل والتفكيك']
      },
      {
        id: 'l1-neuromuscular',
        label: 'الوصلة العصبية العضلية (تشابك عصبي عضلي)',
        category: 'mechanism',
        lectureId: 1,
        description: 'موضع اتصال نهاية ليفة عصبية حركية بالصفيحة النهائية الحركية لليفة العضلية.',
        keyPoints: ['انتقال السيال يفرز الاستيل كولين', 'دخول Na+ يسبب تلاشي فرق الجهد والانقباض']
      },
      {
        id: 'l1-trick-calcium',
        label: 'تريكة الكالسيوم المزدوجة',
        category: 'trick',
        lectureId: 1,
        description: 'أيون الكالسيوم له دورين مختلفين: في الزر العصبي يسبب تحرير الاستيل كولين، وفي الليفة العضلية يسام في تكوين الروابط المستعرضة.',
        examNote: 'غياب الكالسيوم يمنع الانقباض نهائياً من نقطة البداية العصبية.'
      }
    ],
    links: [
      { source: 'l1-core', target: 'l1-physio', relation: 'تتضمن نوع' },
      { source: 'l1-core', target: 'l1-structural', relation: 'تتضمن نوع' },
      { source: 'l1-core', target: 'l1-sarcomere', relation: 'تنفذ الحركة عبر' },
      { source: 'l1-sarcomere', target: 'l1-myosin', relation: 'تتركب من' },
      { source: 'l1-neuromuscular', target: 'l1-sarcomere', relation: 'تحفز انقباض' },
      { source: 'l1-trick-calcium', target: 'l1-neuromuscular', relation: 'ينظم عمل' },
      { source: 'l1-trick-calcium', target: 'l1-myosin', relation: 'يكوّن الروابط في' }
    ]
  },

  // الفصل الثاني: التنسيق الهرموني
  2: {
    nodes: [
      {
        id: 'l2-core',
        label: 'التنسيق الهرموني',
        category: 'core',
        lectureId: 2,
        description: 'جهاز التنسيق الكيميائي الذي يفرز الهرمونات في الدم مباشرة لنقل الرسائل وتنظيم وظائف الجسم.',
        examNote: 'التمييز الدقيق بين التغذية الراجعة السلبية والإيجابية أساس معظم أسئلة امتحانات الثانوية العامة.'
      },
      {
        id: 'l2-pituitary',
        label: 'الغدة النخامية (المايسترو)',
        category: 'structure',
        lectureId: 2,
        description: 'تسيطر على معظم الغدد الصماء عبر الجزء الغدي (TSH, ACTH, FSH, LH, GH) والجزء العصبي (ADH, Oxytocin).',
        keyPoints: ['الجزء العصبي يفرز هرمونات المصنعة في الخلايا العصبية المفرزة بالهيبوثالاموس']
      },
      {
        id: 'l2-adh',
        label: 'هرمون ADH (القابض للأوعية ومضاد إدرار البول)',
        category: 'mechanism',
        lectureId: 2,
        description: 'يعيد امتصاص الماء من نِفرونات الكلية، فيرفع ضغط الدم ويزيد تركيز البول ويقلل حجمه.',
        examNote: 'زيادة ADH ترفع اسموزية البول وتقلل اسموزية الدم.'
      },
      {
        id: 'l2-insulin-glucagon',
        label: 'اتزان الجلوكوز (الأنسولين والجلجوكاجون)',
        category: 'concept',
        lectureId: 2,
        description: 'آلية اتزان متضادة بين خلايا بيتا (أنسولين يقلل السكر) وخلايا ألفا (جلوكاجون يرفع السكر عن طريق الجليكوجين الكبدي).',
        keyPoints: ['الأنسولين يدخل السكر للخلايا ما عدا الفركتوز الذي يدخل دون الحاجة لأنسولين']
      },
      {
        id: 'l2-parathormone-calcitonin',
        label: 'اتزان الكالسيوم (الباراثورمون والكالسينونين)',
        category: 'mechanism',
        lectureId: 2,
        description: 'الباراثورمون يرفع كالسيوم الدم من العظام، والكالسيتونين يقلل كالسيوم الدم ويرسبه بالعظام.',
        examNote: 'علاقة تضاد فسيولوجية للحفاظ على النسبة الطبيعية للكالسيوم بالدم.'
      },
      {
        id: 'l2-feedback',
        label: 'التغذية الراجعة السلبية',
        category: 'trick',
        lectureId: 2,
        description: 'ارتفاع الهرمون المستهدف بالدم يرسل إشارة للغدة النخامية لتقليل الهرمون المنبه له والعكس صحيح.',
        examNote: 'ارتفاع الثيروكسين يسبب انخفاض TSH في الحالات الطبيعية.'
      }
    ],
    links: [
      { source: 'l2-core', target: 'l2-pituitary', relation: 'تقوده' },
      { source: 'l2-pituitary', target: 'l2-adh', relation: 'تفرز من الجزء العصبي' },
      { source: 'l2-core', target: 'l2-insulin-glucagon', relation: 'ينظم سكر الدم عبر' },
      { source: 'l2-core', target: 'l2-parathormone-calcitonin', relation: 'ينظم العظام والكالسيوم عبر' },
      { source: 'l2-feedback', target: 'l2-pituitary', relation: 'تنظم نشاط' },
      { source: 'l2-feedback', target: 'l2-parathormone-calcitonin', relation: 'تتحكم بدورة' }
    ]
  },

  // الفصل الثالث: التكاثر في الكائنات الحية
  3: {
    nodes: [
      {
        id: 'l3-core',
        label: 'التكاثر في الكائنات الحية',
        category: 'core',
        lectureId: 3,
        description: 'الوظيفة الحيوية الموجهة للحفاظ على النوع وحمايته من الانقراض عبر صورتين: جنسي ولاجنسي وتعاقب الأجيال.',
        examNote: 'ركز على التنوع الوراثي وعدد الصبغيات n و 2n في كل مرحلة من دورات الحياة.'
      },
      {
        id: 'l3-asexual',
        label: 'التكاثر اللاجنسي والتوالد البكري',
        category: 'concept',
        lectureId: 3,
        description: 'إنتاج أفراد جديدة من فرد أبوي واحد غالبًا بالانقسام الميتوزي دون أمشاج، ما عدا حالات خاصة كالتوالد البكري في حشرة المن ونحل العسل.',
        examNote: 'ذكور نحل العسل أحادية الصبغيات n وتنتج أمشاجها بالانقسام الميتوزي!'
      },
      {
        id: 'l3-alternation',
        label: 'تعاقب الأجيال (بلازموديوم الفلاريا والسرخس)',
        category: 'mechanism',
        lectureId: 3,
        description: 'ظاهرة يتعاقب فيها جيل جنسي يتكاثر بالأمشاج (2n أو n) مع جيل أو أكثر لاجنسي لتجميع ميزات الصورتين.',
        keyPoints: ['الطور الحركي (الاووكينيت) 2n يخترق جدار معدة البعوضة ليتحول لطور جرثومي n بالانقسام الميوزي']
      },
      {
        id: 'l3-human-repro',
        label: 'التكاثر في الإنسان وتكوين الأمشاج',
        category: 'concept',
        lectureId: 3,
        description: 'مراحل النمو والتشكل المنوي والبيضي: النمو، التضاعف، النضج، والتشكل النهائي.',
        examNote: 'البويضة في الإنسان تكتمل انقسامها الميوزي الثاني فقط لحظة الإخصاب (الانقسام المؤجل).'
      },
      {
        id: 'l3-menstrual-cycle',
        label: 'دورة الطمث والهرمونات الأنثوية',
        category: 'mechanism',
        lectureId: 3,
        description: 'دورة 28 يوماً تنقسم لمرحلة نضج البويضة (FSH والحيض)، التبويض (LH)، ومرحلة تكوين الجسم الأصفر (البروجسترون والاستروجين).',
        examNote: 'أعلى مستوى لـ LH يكون في اليوم الـ 13 إلى 14 ليسبب تفجير حويصلة جراف.'
      },
      {
        id: 'l3-trick-n-chromosomes',
        label: 'تريكة حساب الصبغيات n و 2n',
        category: 'trick',
        lectureId: 3,
        description: 'التمييز بين الخلايا الجسدية والجنسية والأطوار أحادية وثنائية المجموعة الصبغية في البلازموديوم ونحل العسل والسرخس.',
        examNote: 'الجرثومة في النبات الجرثومي 2n تنقسم ميوزياً لتنتج جراثيم n.'
      }
    ],
    links: [
      { source: 'l3-core', target: 'l3-asexual', relation: 'يشمل أنماط' },
      { source: 'l3-core', target: 'l3-alternation', relation: 'يتجلى في' },
      { source: 'l3-core', target: 'l3-human-repro', relation: 'يتوج في' },
      { source: 'l3-human-repro', target: 'l3-menstrual-cycle', relation: 'ينظم دورياً بواسطة' },
      { source: 'l3-trick-n-chromosomes', target: 'l3-asexual', relation: 'يميز حالة' },
      { source: 'l3-trick-n-chromosomes', target: 'l3-alternation', relation: 'يحدد أطوار' }
    ]
  },

  // الفصل الرابع: المناعة في الكائنات الحية
  4: {
    nodes: [
      {
        id: 'l4-core',
        label: 'جهاز المناعة',
        category: 'core',
        lectureId: 4,
        description: 'منظومة الدفاع المعقدة المقسمة إلى خطوط دفاع متتابعة: خط الدفاع الأول والثاني (فطرية) وخط الدفاع الثالث (مكتسبة).',
        examNote: 'التمييز بين المناعة الخلطية (بالأجسام المضادة B) والمناعة الخلوية (بالخلايا التائية T).'
      },
      {
        id: 'l4-innate',
        label: 'المناعة الفطرية (خط الدفاع 1 و 2)',
        category: 'concept',
        lectureId: 4,
        description: 'حواجز طبيعية غير متخصصة كالحمض والدموع والمخاط (خط 1) والاستجابة بالالتهاب والهستامين والإنترفيرونات (خط 2).',
        keyPoints: ['الخلايا الصارية والقاعدية تفرز الهستامين لتمدد الأوعية الدموية']
      },
      {
        id: 'l4-humoral',
        label: 'المناعة الخلطية (الأجسام المضادة)',
        category: 'mechanism',
        lectureId: 4,
        description: 'استجابة مناعية تتولها الخلايا البائية B البلزمية لإنتاج أجسام مضادة متخصصة ترتبط بالأنتيجين وتدمره عبر المتممات والبلعمة.',
        examNote: 'الأجسام المضادة لا تستطيع القضاء على الفيروسات داخل الخلايا بل في سوائل الجسم فقط.'
      },
      {
        id: 'l4-cellular',
        label: 'المناعة الخلوية (الخلايا التائية)',
        category: 'mechanism',
        lectureId: 4,
        description: 'استجابة مناعية بواسطة الخلايا التائية (Th المساعدة، Tc السامة والقاتلة، وTs المثبطة) باستخدام السيتوكينات والبيرفورين.',
        keyPoints: ['Th تفرز إنترلوكينات وسيتوكينات لتنشيط B و Tc', 'Tc تفرز بروتين البيرفورين وسموم جينية']
      },
      {
        id: 'l4-antibodies',
        label: 'تركيب الجسم المضاد وآليات عمله',
        category: 'structure',
        lectureId: 4,
        description: 'بروتين برابطتين كبريتيديتين مزوجتين وموقعين متغيرين لارتباط الانتيجين بنفس التخصص.',
        examNote: 'طرق العمل: التعادل، التلازن (الالتصاق - أفضلها IgM)، الترسيب، التحلل وإبطال الأثر.'
      },
      {
        id: 'l4-trick-interferons',
        label: 'تريكة الإنترفيرونات وسلسلة التنشيط',
        category: 'trick',
        lectureId: 4,
        description: 'الإنترفيرونات تفرز من الخلايا المصابة بالفيروس لتنبه الخلايا السليمة المجاورة لإنتاج إنزيمات تثبط نسخ الفيروس.',
        examNote: 'الإنترفيرون ليس قاطلاً للفيروس بنفسه بل منبه دفاعي للحماية.'
      }
    ],
    links: [
      { source: 'l4-core', target: 'l4-innate', relation: 'بدءاً من' },
      { source: 'l4-core', target: 'l4-humoral', relation: 'يتطور إلى' },
      { source: 'l4-core', target: 'l4-cellular', relation: 'يتآزر مع' },
      { source: 'l4-humoral', target: 'l4-antibodies', relation: 'تنتج وتعتمد على' },
      { source: 'l4-cellular', target: 'l4-humoral', relation: 'تحفزها السيتوكينات من Th' },
      { source: 'l4-trick-interferons', target: 'l4-innate', relation: 'تتبع خط الدفاع 2 في' }
    ]
  },

  // الفصل الخامس: البيولوجيا الجزيئية - DNA
  5: {
    nodes: [
      {
        id: 'l5-core',
        label: 'تركيب وتضاعف DNA',
        category: 'core',
        lectureId: 5,
        description: 'المادة الوراثية للخلية المكونة من شريطين حلزونيين متوازيين عكسياً ومترابطين بقواعد نيتروجينية مكملة.',
        examNote: 'تركيب النيوكليوتيدة والرابطة الهيدروجينية بين C-G (ثلاثية) و A-T (ثنائية).'
      },
      {
        id: 'l5-enzymes',
        label: 'إنزيمات تضاعف الـ DNA',
        category: 'mechanism',
        lectureId: 5,
        description: 'ثلاثية عمل متكاملة: إنزيم اللولب (فك الالتواء)، إنزيم البلمرة (بناء الشريط 5 إلى 3)، وإنزيم الربط (وصل قطع الشريط القالب 5 إلى 3).',
        keyPoints: ['البلمرة يبني الشريط الجديد اتجاه 5\'->3\' فقط بنفس اتجاه حركة اللولب على أحد الشريطين']
      },
      {
        id: 'l5-repair',
        label: 'إصلاح عيوب الـ DNA',
        category: 'mechanism',
        lectureId: 5,
        description: 'منظومة مكونة من 20 إنزيم ربط تتعرف على التلف وتصلحه بشرط وجود النسخة القالبية السليمة على الشريط المقابل.',
        examNote: 'إذا تلف القواعد المتقابلة في نفس الوقت ونفس الموقع يفقد الإصلاح قدرته وتحدث طفرة.'
      },
      {
        id: 'l5-mutations',
        label: 'الطفرات وأنواعها',
        category: 'concept',
        lectureId: 5,
        description: 'التغير الفجائي في تركيب المادة الوراثية: طفرات جينية (تغير قواعد)، طفرات صبغية (تركيبية أو عددي)، وطفرات مشيجية/جسدية.',
        keyPoints: ['الطفرة المشيجية تورث بينما الجسدية لا تورث غالباً']
      },
      {
        id: 'l5-trick-replication-math',
        label: 'تريكة مسائل تضاعف الـ DNA والقواعد',
        category: 'trick',
        lectureId: 5,
        description: 'نسب القواعد: A+G = C+T = 50% من قواعد اللولب المزدوج، وحساب مجموع الروابط الهيدروجينية.',
        examNote: 'قانون تشارجاف ينطبق حصراً على DNA المزدوج وليس الشريط المفرد أو RNA.'
      }
    ],
    links: [
      { source: 'l5-core', target: 'l5-enzymes', relation: 'يتضاعف بواسطة' },
      { source: 'l5-core', target: 'l5-repair', relation: 'يحافظ على ثباته بـ' },
      { source: 'l5-core', target: 'l5-mutations', relation: 'خلل الإصلاح يسبب' },
      { source: 'l5-trick-replication-math', target: 'l5-core', relation: 'تطبق قوانين القواعد على' },
      { source: 'l5-enzymes', target: 'l5-repair', relation: 'تشارك إنزيمات الربط في' }
    ]
  },

  // الفصل السادس: RNA وتخليق البروتين
  6: {
    nodes: [
      {
        id: 'l6-core',
        label: 'RNA وتخليق البروتين',
        category: 'core',
        lectureId: 6,
        description: 'عملية ترجمة الشفرة الوراثية المحمولة على mRNA لبناء سلاسل عديد الببتيد والبروتينات الوظيفية والتركيبية.',
        examNote: 'خطوات الترجمة: البدء، الاستطالة، وإنهاء الترجمة عند كودون الوقف.'
      },
      {
        id: 'l6-mrna',
        label: 'الـ mRNA (الرسول والشفرة)',
        category: 'concept',
        lectureId: 6,
        description: 'نسخة الشريط القالب تحتوي على موقع التثبيت بالريبوسوم، كودون البدء AUG، كودونات الأحماض، كودون الوقف، وذيل عديد الأدينين.',
        keyPoints: ['ذيل عديد الأدينين يحمي mRNA من التحلل في السيتوبلازم بواسطة الإنزيمات']
      },
      {
        id: 'l6-trna',
        label: 'الـ tRNA (الناقل ومضاد الكودون)',
        category: 'structure',
        lectureId: 6,
        description: 'جزيء RNA مطوي يحمل حمضاً أمينياً عند الطرف 3\' وموقع مضاد الكودون المقابل لكودون الـ mRNA.',
        examNote: 'عدد أنواع tRNA يساوي عدد كودونات الأحماض الأمينية (61 نوعاً) لأن كودونات الوقف الـ 3 لا تحمل tRNA.'
      },
      {
        id: 'l6-ribosome',
        label: 'الريبوسومات وعملية الترجمة',
        category: 'mechanism',
        lectureId: 6,
        description: 'مصنع البروتين المكون من تحت وحدتي ريبوسوم كبيرة وصغيرة ويوفر موقعين: الببتيديل P والأمينوأسيل A.',
        keyPoints: ['تتكون الرابطة الببتيدية بالتفاعل الناقل للببتيديل في الموقع P']
      },
      {
        id: 'l6-trick-codons-math',
        label: 'تريكة مسائل الكودونات والروابط',
        category: 'trick',
        lectureId: 6,
        description: 'عدد الكودونات = (عدد النيوكليوتيدات / 3). عدد الأحماض = عدد الكودونات - 1 (كودون الوقف). عدد الروابط = عدد الأحماض - 1.',
        examNote: 'كودون الوقف يحسب ضمن كودونات الـ mRNA ولكنه لا يترجم لحمض أميني ولا يستهلك tRNA.'
      }
    ],
    links: [
      { source: 'l6-core', target: 'l6-mrna', relation: 'ينسخ شفرته عبر' },
      { source: 'l6-core', target: 'l6-trna', relation: 'ينقل الأحماض عبر' },
      { source: 'l6-core', target: 'l6-ribosome', relation: 'يتم البناء داخل' },
      { source: 'l6-mrna', target: 'l6-trna', relation: 'يرتبط بمضاد الكودون في' },
      { source: 'l6-ribosome', target: 'l6-mrna', relation: 'يتحرك على شريط' },
      { source: 'l6-trick-codons-math', target: 'l6-mrna', relation: 'يحسب كودونات' }
    ]
  }
};

// Cross-chapter connections between concept nodes
export const crossChapterLinks: ConceptMapLink[] = [
  { source: 'l1-trick-calcium', target: 'l2-parathormone-calcitonin', relation: 'كالسيوم العظام والدم يربط الحركة بالهرمونات' },
  { source: 'l2-pituitary', target: 'l3-menstrual-cycle', relation: 'FSH & LH يربطان الهرمونات بتكاثر الأنثى' },
  { source: 'l4-humoral', target: 'l6-core', relation: 'الأجسام المضادة هي بروتينات تنتج بتخليق البروتين' },
  { source: 'l5-core', target: 'l6-mrna', relation: 'DNA هو القالب النسخي لبناء mRNA' },
  { source: 'l4-cellular', target: 'l5-mutations', relation: 'المناعة الخلوية (Tc & NK) تهاجم الخلايا ذات الطفرات السرطانية' }
];
