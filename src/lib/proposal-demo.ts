import type { ProposalData } from "@/types";

// Real proposal used as a fixture for the print preview (id = "demo").
export const DEMO_PROPOSAL: ProposalData = {
  title: "הצעה לחופשת סקי חלופית",
  subtitle: "ואל טורנס, צרפת  |  6–13 במרץ 2027",
  intro:
    "בהמשך לחופשת הסקי שהוזמנה לחודש מרץ 2026, מוצעת בזאת חופשת סקי חלופית בוואל טורנס, צרפת, בתאריכים 6.3.2027 עד 13.3.2027, למשך 7 לילות ו־6 ימי גלישה.",
  sections: [
    {
      heading: "טיסות",
      blocks: [
        { type: "banner", text: "טיסת הלוך — שבת, 6.3.2027  ·  תל אביב (TLV) ← ליון (LYS)" },
        { type: "kv", rows: [["חברת תעופה", "Transavia"], ["שעת המראה", "19:25"], ["שעת נחיתה", "23:15"], ["סוג טיסה", "ישירה"]] },
        { type: "banner", text: "טיסת חזור — שבת, 13.3.2027  ·  ליון (LYS) ← תל אביב (TLV)" },
        { type: "kv", rows: [["חברת תעופה", "Transavia"], ["שעת המראה", "13:05"], ["שעת נחיתה", "18:15"], ["סוג טיסה", "ישירה"]] },
      ],
    },
    {
      heading: "החבילה כוללת",
      blocks: [
        { type: "list", items: [
          "טיסות הלוך וחזור בין תל אביב לליון.",
          "הסעה משדה התעופה בליון לוואל טורנס ביום ההגעה.",
          "הסעה מוואל טורנס לשדה התעופה בליון ביום החזרה.",
          "7 לילות לינה בוואל טורנס.",
          "6 ימי גלישה.",
          "סקי פס בהתאם לסוג ולהיקף שהוזמנו.",
        ] },
      ],
    },
    {
      heading: "פירוט מחירים",
      blocks: [
        { type: "table",
          header: ["פריט", "כמות", "מחיר ליחידה", "סה\"כ"],
          rows: [
            ["טיסות תל אביב – ליון – תל אביב", "4", "€320", "€1,280"],
            ["לינה, 7 לילות במרכז ואל טורנס", "1 דירה", "€2,100", "€2,100"],
            ["הסעות שדה תעופה הלוך וחזור", "4", "€75", "€300"],
            ["סקי פס, 6 ימי גלישה", "4", "€290", "€1,160"],
          ],
          total: ["סה\"כ לתשלום", "", "", "€4,840"] },
        { type: "note", text: "המחירים נקובים באירו וכוללים מע\"מ. ההצעה בתוקף ל־14 ימים ממועד הנפקתה, וכפופה לזמינות במועד ההזמנה." },
      ],
    },
    {
      heading: "סיכום החופשה",
      blocks: [
        { type: "summary", rows: [
          ["יעד", "ואל טורנס, צרפת"],
          ["תאריכים", "6.3.2027 – 13.3.2027"],
          ["משך החופשה", "7 לילות"],
          ["ימי גלישה", "6 ימים"],
          ["טיסות", "תל אביב – ליון – תל אביב"],
          ["לינה", "מרכז ואל טורנס"],
        ] },
      ],
    },
  ],
  signature: {
    heading: "אישור ההצעה",
    text: "אני מאשר/ת כי קראתי את ההצעה, הבנתי את תנאיה ואני מסכים/ה לקבל את החופשה החלופית בהתאם למפורט לעיל.",
    fields: ["שם מלא", "תאריך", "חתימה", "מספר הזמנה"],
  },
};

// Reusable saved blocks the editor can insert with one click.
export const SAVED_BLOCKS: { name: string; heading: string; block: import("@/types").ProposalBlock }[] = [
  { name: "תוקף ההצעה", heading: "תנאים", block: { type: "note", text: "ההצעה בתוקף ל־14 ימים ממועד הנפקתה, וכפופה לזמינות במועד אישור ההזמנה." } },
  { name: "אמצעי תשלום", heading: "תנאים", block: { type: "text", text: "התשלום מתבצע בכרטיס אשראי (עד 3 תשלומים ללא ריבית) או בהעברה בנקאית. בתשלום בכרטיס נוספת עמלת סליקה של 1.9%." } },
  { name: "טיסות — גורם חיצוני", heading: "תנאים", block: { type: "text", text: "הטיסות המפורטות בהצעה זו (ככל שמפורטות) הן שירות חיצוני. כל עניין הנוגע לטיסה — לרבות שינויים, עיכובים, ביטולים, כבודה ותנאי ההזמנה — כפוף באופן בלעדי לחוזה ולתנאי ההזמנה מול חברת התעופה שדרכה הוזמנה הטיסה, ואינו באחריות החברה." } },
  { name: "כפיפות לתקנון האתר", heading: "תנאים", block: { type: "text", text: "ביטול הזמנה, לרבות מועדים ושיעורי החזר, כפוף למדיניות הביטולים ולתקנון המפורסמים באתר החברה." } },
  { name: "אישור ותשלום", heading: "תנאים", block: { type: "text", text: "אישור הצעה זו על ידי הלקוח מהווה הצהרה כי קרא את ההצעה על כל תנאיה ואישר אותם. ביצוע תשלום כלשהו על חשבון ההזמנה מהווה הסכמה מלאה ומחייבת לכל התנאים המפורטים לעיל." } },
];

// Terms that appear on every proposal by default (validity, payment, flights, site terms, approval).
// No inline cancellation-days/percentage clause — cancellations are governed by
// the site's own cancellation policy, referenced via "כפיפות לתקנון האתר" above.
export const DEFAULT_TERMS_SECTION: import("@/types").ProposalSection = {
  heading: "תנאים",
  blocks: SAVED_BLOCKS.map(b => b.block),
};

// Legal disclosures that must appear on every printed/PDF proposal — even ones
// created before these clauses existed — so the terms row is never missing them.
export const MANDATORY_TERM_BLOCKS: import("@/types").ProposalBlock[] = [
  SAVED_BLOCKS[2].block, // טיסות — גורם חיצוני
  SAVED_BLOCKS[3].block, // כפיפות לתקנון האתר
  SAVED_BLOCKS[4].block, // אישור ותשלום
];
