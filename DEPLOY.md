# النشر المجاني + Docker للتعلّم

الملف ده تشيك-ليست سريعة تمشي عليها من فوق لتحت. الهدف: **الموقع شغّال أونلاين مجاناً**، وكمان **Dockerfile تتعلّم عليه**.

للتفاصيل الأعمق (الأمان، تظبيط البراند، مشاكل شائعة) ارجع لـ `README.md`.

---

## أول حاجة: هل ده مجاني فعلاً؟

آه. المسار ده مبني على خطتين مجانيتين:

- **Supabase Free** — الداتابيز والتخزين والدخول. ٥٠٠ ميجا داتابيز + ١ جيجا ملفات.
- **Vercel Hobby** — استضافة الموقع نفسه. ١٠٠ جيجا نقل بيانات في الشهر.

ده بيكفي متجر صغير/متوسط من غير ما تدفع مليم. حاجتين بس خليهم في دماغك:

1. **مشروع Supabase المجاني بيتوقّف مؤقتاً لو محدش استخدمه ٧ أيام.** بيرجع لما تفتحه تاني، بس أول طلب بياخد شوية. للتجربة والتعلّم عادي خالص؛ لو الموقع اشتغل مع ناس حقيقيين خلّي حد يفتحه كل كام يوم أو رقّي لـ Pro.
2. **Vercel Hobby رسمياً للمشاريع الشخصية/غير التجارية.** للتعلّم والبورتفوليو تمام. أول ما البيع يبقى جدّي، رقّي لـ Pro (٢٠ دولار/شهر) عشان تكون مظبوط مع شروطهم.

الأرقام دي كلها موجودة بتفصيل في `README.md` تحت "التكلفة الشهرية".

---

## الجزء الأول — انشر مجاني (Vercel + Supabase)

المسار الموصى بيه. مفيش Docker هنا خالص — Vercel بيبني وينشر لوحده.

### ١) اعمل مشروع Supabase مجاني

روح [supabase.com](https://supabase.com) ← سجّل بحساب GitHub ← `New project`.

- اسم المشروع: أي حاجة.
- Database password: حطّ باسورد قوي واحفظه.
- Region: **Frankfurt (eu-central-1)** — أقرب واحدة لمصر في الخطة المجانية.

استنى دقيقتين لحد ما يجهّز.

### ٢) ابنِ الداتابيز من `schema.sql`

من القايمة الجانبية: `SQL Editor` ← `New query`.

افتح ملف `supabase/schema.sql` من المشروع، انسخ **كل** اللي فيه، الزقه في المحرّر، واضغط **Run**.

ده بيعمل في مرة واحدة: الجداول + القيود + الدوال + سياسات RLS + الـ Storage buckets + بيانات أولية للتجربة (براندات، عطور، شحن ٢٧ محافظة، إعدادات).

✅ اتأكّد: من `Table Editor` تشوف `products` و `variants` و `orders`. من `Storage` تشوف باكِتين: `products` و `receipts`.

### ٣) انسخ المفاتيح

من `Project Settings` ← `API` انسخ التلاتة دول (هنستخدمهم في خطوة ٥):

| المفتاح | مكانه في Supabase |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | anon **public** key |
| `SUPABASE_SERVICE_ROLE_KEY` | service_role key — **سرّي جداً** |

⚠️ الـ `service_role` بيتخطّى كل الأمان. عمره ما ياخد بادئة `NEXT_PUBLIC_` وعمره ما يتحط في كود بيوصل للمتصفح.

### ٤) اعمل حساب الأدمن

الأدمن بتضيفه بإيدك — مفيش تسجيل من الموقع (ده مقصود لأمان اللوحة).

**أولاً** في Supabase: `Authentication` ← `Users` ← `Add user` ← `Create new user`. حطّ إيميلك وباسورد قوي، وعلّم `Auto Confirm User`.

**تانياً** في `SQL Editor` شغّل ده (بدّل الإيميل بتاعك):

```sql
insert into public.admins (user_id, email, full_name)
select id, email, 'محمود علي'
from auth.users
where email = 'you@example.com'
on conflict (user_id) do nothing;
```

### ٥) ارفع على GitHub وبعدين Vercel

ارفع الكود على GitHub (repo خاص)، وبعدين:

روح [vercel.com](https://vercel.com) ← سجّل بحساب GitHub ← `Add New` ← `Project` ← اختار الـ repo.

Vercel هيعرف إنه Next.js لوحده — **ماتغيّرش أي حاجة في إعدادات البناء**.

قبل ما تضغط Deploy، افتح `Environment Variables` وحطّ التلاتة:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...
```

اضغط **Deploy**. أول بناء ياخد حوالي دقيقتين، وهيطلعلك رابط زي `your-store.vercel.app`.

> 💡 لو البناء وقع: ٩٩٪ السبب متغيّر بيئة ناقص أو غلط. راجع الخطوة دي.

### ٦) اربط رابط الموقع بـ Supabase Auth

خطوة بينساها الناس فتحصل مشاكل دخول غريبة. في Supabase: `Authentication` ← `URL Configuration`:

- `Site URL` = رابط Vercel بتاعك (أو دومينك لو ربطته).
- ضيف نفس الرابط في `Redirect URLs`.

### ٧) اعمل أوردر تجريبي بنفسك

قبل ما تفتحه لأي حد:

1. ضيف عطرين للعربة ← `/checkout`.
2. جرّب **الدفع عند الاستلام** واتأكّد إن رسم التحصيل بيظهر في الإجمالي.
3. أكّد الأوردر وخُد رقمه ← روح `/track` واتأكّد إنه بيظهر.
4. ادخل `/admin/login` ← افتح الأوردر ← اطبع الفاتورة ← حوّله "مؤكّد" وبعدين "ملغي" واتأكّد إن المخزون رجع.

خلصت. الموقع شغّال أونلاين مجاناً. 🎉

---

## الجزء التاني — Docker (للتعلّم)

الجزء ده **مش** للنشر المجاني — Vercel أسهل وأنضف مجاناً. Docker مفيد لما:

- عايز تتعلّم إزاي بتحزّم أبب Next.js في صورة (image).
- ناوي تنشر بعدين على سيرفر خاص (VPS) بدل Vercel.

الصورة هنا بتشغّل **الأبب بس**، وبيوصّل بنفس Supabase السحابي من خطوة ١. يعني نفس الداتابيز بالظبط، من غير أي تغيير — سواء الأبب شغّال على جهازك، على Vercel، أو في كونتينر.

### أهم نقطة قبل ما تبني

الـ build بيتصل بـ Supabase عشان يجهّز صفحات العطور مسبقاً. يعني وقت `docker build` لازم:

- النت شغّال.
- الرابط والمفتاح (من خطوة ٣) صح.

لو الداتابيز لسه فاضية عادي — بيطلع كاتالوج فاضي وبيتملّى لوحده لما تزوّد عطور.

### الطريقة الأسهل: docker compose

اعمل ملف اسمه `.env` (من غير `.local`) جنب `docker-compose.yml` وحطّ فيه الأربعة:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
NEXT_PUBLIC_SITE_URL=http://localhost:3000
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...
```

وبعدين أمر واحد:

```bash
docker compose up --build
```

افتح `http://localhost:3000`. خلاص.

### الطريقة اليدوية: docker مباشرة

لو عايز تفهم اللي بيحصل تحت من غير compose:

```bash
# البناء — المفاتيح العامة بتتحرق جوه الصورة وقت البناء
docker build \
  --build-arg NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co \
  --build-arg NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi... \
  --build-arg NEXT_PUBLIC_SITE_URL=http://localhost:3000 \
  -t mahmoud-ali-store .

# التشغيل — المفتاح السرّي بيتحط دلوقتي بس، مش في الصورة
docker run -p 3000:3000 \
  -e SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi... \
  mahmoud-ali-store
```

### ليه المفاتيح متقسّمة كده؟

سؤال مهم يستاهل تفهمه:

- **مفاتيح `NEXT_PUBLIC_*`** بتتحرق جوه كود المتصفح وقت البناء — عشان كده لازم تكون موجودة كـ `--build-arg`. دي مفاتيح عامّة ومحميّة بـ RLS، فعادي تكون في الصورة.
- **`SUPABASE_SERVICE_ROLE_KEY`** سرّي وبيتخطّى الأمان، فعمره ما بيتحرق في الصورة. بيتحط وقت التشغيل بـ `-e` بس. لو حرقته في الصورة، أي حد ياخد الصورة ياخد مفتاح السيرفر بتاعك.

القاعدة دي هي نفسها اللي Vercel بيطبّقها ورا الكواليس — إنت هنا بتشوفها بعينك.

---

## ملخص متغيّرات البيئة

| المتغيّر | إيه هو | وقت البناء؟ | سرّي؟ |
|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | رابط مشروع Supabase | ✅ | لا |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | مفتاح anon العام | ✅ | لا |
| `NEXT_PUBLIC_SITE_URL` | رابط الموقع (للروابط المطلقة) | ✅ | لا |
| `SUPABASE_SERVICE_ROLE_KEY` | مفتاح السيرفر — للأوردرات | ❌ وقت التشغيل | ✅ جداً |

على **Vercel**: كلهم بيتحطّوا في `Environment Variables` وهو بيتصرّف صح.
في **Docker**: التلاتة الأولانيين `build args`، والأخير `-e` وقت التشغيل.
