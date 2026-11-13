# صحبة (Sohba)

صاحبك في طريقك لربنا، من أول خطوة. من ماو سوليوشنز.

PWA بـ Node/Express + PostgreSQL + Vanilla JS.

## الفكرة التقنية: محرك واحد

`tracks → lessons → blocks`. أي مسار جديد (السنة، السيرة، ...) هو **بيانات في `content/`** مش كود جديد.

- المحتوى كله في `content/` كملفات JSON، وده بيخلي المراجعة الشرعية تتعمل على Git.
- أي درس حالته مش `published` مبيوصلش للناس. والـ DB نفسها بترفض `approved` أو `published` من غير `reviewed_by`.
- أي آية أو حديث أو دعاء لازم يكون ليه `source`، والـ DB بترفض غير كده.

## التشغيل

```bash
cp .env.example .env        # حط DATABASE_URL
npm install
npm run migrate
npm run seed                # يتعاد بأمان بعد أي تعديل في content/
npm run dev                 # http://localhost:3000
```

`PREVIEW_DRAFTS=true` بيعرض المسودات (للتطوير والمراجعة بس).

`npm run build:preview` بيطلع `dist/preview.html`: نسخة ملف واحد تشتغل من غير سيرفر.

## الـ Deploy (Vercel + Neon، من غير كارت)

1. اعمل import للـ repo من vercel.com/new. هيتعرف على Express لوحده من `app.js`.
2. ضيف Environment Variables: `DATABASE_URL` (من Neon) و`PREVIEW_DRAFTS=true` لحد الإطلاق.
3. `vercel-build` بيشغّل الـ migrate والـ seed مع كل deploy.

`render.yaml` موجود كبديل لو حبينا سيرفر دايم.

## الـ API

| Route | |
|---|---|
| `GET /api/tracks` | المسارات وعدد الدروس |
| `GET /api/tracks/:slug` | المسار ودروسه |
| `GET /api/lessons/:slug` | الدرس بالبلوكات والمصادر والدرس اللي بعده |
| `GET /api/daily` | وِرد اليوم: آية ودعاء، ثابتين طول اليوم |
| `GET /healthz` | فحص السيرفر والـ DB |

## الجاي

- لوحة التحكم `/admin` و workflow المراجعة
- الحسابات الاختيارية ومزامنة المراجعة المتباعدة (`progress`)
