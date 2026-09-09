# syntax=docker/dockerfile:1

# ══════════════════════════════════════════════════════════════════
#  محمود علي للعطور — صورة Docker للأبب (Next.js standalone)
#
#  الصورة دي بتشغّل الأبب بس، وبيوصّل بـ Supabase السحابي بتاعك.
#  يعني مفيش داتابيز جوه الكونتينر — أبسط وأخف حاجة، وممتازة للتعلّم.
#
#  البناء:
#    docker build \
#      --build-arg NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co \
#      --build-arg NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi... \
#      --build-arg NEXT_PUBLIC_SITE_URL=https://your-site.com \
#      -t mahmoud-ali-store .
#
#  التشغيل (مفتاح الخدمة بيتحطّ وقت التشغيل، مش وقت البناء):
#    docker run -p 3000:3000 \
#      -e SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi... \
#      mahmoud-ali-store
# ══════════════════════════════════════════════════════════════════


# ---------- ① الاعتماديات ----------
FROM node:20-alpine AS deps
WORKDIR /app
# alpine ناقصه مكتبة بتحتاجها بعض حزم Node
RUN apk add --no-cache libc6-compat
COPY package.json package-lock.json* ./
# لو فيه ملف قفل (package-lock.json) بنستخدم npm ci — أدق وأسرع وأضمن.
# لو لسه معملتش npm install محلياً (فمفيش قفل) بنستخدم npm install عادي.
RUN if [ -f package-lock.json ]; then npm ci; else npm install; fi


# ---------- ② البناء ----------
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# ⚠️ متغيرات NEXT_PUBLIC بتتحرق جوه كود المتصفح وقت البناء نفسه،
# فلازم تكون موجودة هنا. دول مفاتيح عامّة (anon) ومحميّة بـ RLS،
# فعادي تتحرق في الصورة. مفتاح الخدمة السرّي مش هنا — بيتحط وقت التشغيل.
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ARG NEXT_PUBLIC_SITE_URL
ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY
ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL
ENV NEXT_TELEMETRY_DISABLED=1

# ملاحظة: الـ build بيتصل بـ Supabase عشان يجهّز صفحات الكاتالوج مسبقاً.
# فلازم الرابط والمفتاح يكونوا صح والنت شغّال وقت البناء. لو الداتابيز
# لسه فاضية عادي — بيطلع كاتالوج فاضي وبيتحدّث لوحده بعد ما تزوّد بيانات.
RUN npm run build


# ---------- ③ التشغيل ----------
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# بنشغّل بمستخدم عادي مش root — أمان أحسن
RUN addgroup --system --gid 1001 nodejs \
 && adduser  --system --uid 1001 nextjs

# ناتج standalone: فيه server.js وأقل قدر من node_modules
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# server.js بيتولّد تلقائياً جوه ناتج standalone
CMD ["node", "server.js"]
