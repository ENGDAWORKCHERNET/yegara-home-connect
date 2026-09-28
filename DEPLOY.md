# Yegara — Cloudflare Deployment Guide

## Step 1: Log in to Cloudflare

Run this command and follow the browser authentication flow:

```
cmd /c "npx wrangler login"
```

## Step 2: Set Secrets

Run each of these commands and paste the value when prompted:

```powershell
# Your Supabase URL (from your .env)
cmd /c "npx wrangler secret put SUPABASE_URL --config .output/server/wrangler.json"
# When prompted, enter: https://ftvznbpsfvgzzeldycjv.supabase.co

# Your Supabase publishable key (from your .env)
cmd /c "npx wrangler secret put SUPABASE_PUBLISHABLE_KEY --config .output/server/wrangler.json"
# When prompted, enter your publishable key

# Supabase SERVICE ROLE KEY (get from Supabase dashboard → Project Settings → API → service_role)
cmd /c "npx wrangler secret put SUPABASE_SERVICE_ROLE_KEY --config .output/server/wrangler.json"
# When prompted, enter your service_role key (starts with eyJ...)

# Your Grok API key
cmd /c "npx wrangler secret put GROK_API_KEY --config .output/server/wrangler.json"
# When prompted, enter your Grok / xAI API key
```

## Step 3: Deploy

```
cmd /c "npm run deploy"
```

Your app will be live at: `https://yegara-home-connect.<your-cloudflare-subdomain>.workers.dev`

## Step 4: Add a Custom Domain (Optional)

In the Cloudflare dashboard → Workers & Pages → yegara-home-connect → Settings → Domains & Routes → Add Custom Domain

---

> **Get your Supabase Service Role Key:**
> Go to https://supabase.com/dashboard/project/ftvznbpsfvgzzeldycjv/settings/api
> Copy the `service_role` key (labeled "Project API keys")
