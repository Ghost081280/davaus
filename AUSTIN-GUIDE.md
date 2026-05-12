# Austin's Guide to Running davaus.com

Hey Austin &mdash; Andrew put this site together as a kickoff preview. This guide gets you from zero to *"I can update my own website with Claude"* in about 30 minutes.

We are going to do four things:

1. Get the code on your computer
2. Connect it to Railway so it goes live
3. Point your domain at it via Cloudflare
4. Teach you how to ask Claude Opus 4.7 to make changes

You already use Jarvis, so most of this will feel familiar. If anything is unclear, just message Andrew.

---

## Step 1 &mdash; Get the code

### 1a. Fork the repo

Andrew is going to send you a link that looks like `https://github.com/[andrew]/davaus`. Open it. In the top-right of the GitHub page, click **Fork**.

That copies the repo into *your* GitHub account so you own it. From now on you work on **your** fork, not Andrew's.

### 1b. Clone it to your computer

Open a terminal (on Mac: Cmd+Space, type "Terminal", hit Enter). Type:

```bash
cd ~/Documents
git clone https://github.com/[your-username]/davaus.git
cd davaus
```

Replace `[your-username]` with your actual GitHub username.

### 1c. Preview it locally

While you are in the `davaus` folder:

```bash
cd site
python3 -m http.server 8000
```

Open your browser to `http://localhost:8000`. You should see your new site. Hit Ctrl+C in the terminal to stop the server when you are done looking.

---

## Step 2 &mdash; Deploy to Railway

You already have Railway set up for Jarvis. We are going to add a second service.

1. Log into [railway.app](https://railway.app).
2. Click **New Project** &rarr; **Deploy from GitHub repo**.
3. Pick your `davaus` repo.
4. Railway will auto-detect this is a static site. If it asks for a start command, use:
   ```
   cd site && python3 -m http.server $PORT
   ```
5. Once it builds (about 60 seconds), Railway gives you a URL like `davaus-production.up.railway.app`. Click it. Your site is live.

Every time you push code to GitHub, Railway redeploys automatically. You do not have to think about it.

---

## Step 3 &mdash; Point davaus.com at Railway

You already use Cloudflare for your domain. Two steps:

### 3a. Get the Railway domain target

In Railway, click your service &rarr; **Settings** &rarr; **Networking** &rarr; **Custom Domain**. Add `davaus.com` and `www.davaus.com`. Railway gives you a CNAME target like `something.up.railway.app`.

### 3b. Update Cloudflare DNS

1. Log into [dash.cloudflare.com](https://dash.cloudflare.com).
2. Click your `davaus.com` domain.
3. Click **DNS** in the sidebar.
4. Delete any existing `A` or `CNAME` records pointing to your old host.
5. Add a new `CNAME` record:
   - **Name:** `@` (this means the root domain)
   - **Target:** the Railway target from step 3a
   - **Proxy status:** DNS only (gray cloud, not orange &mdash; Railway handles SSL)
6. Add another `CNAME`:
   - **Name:** `www`
   - **Target:** same Railway target
   - **Proxy status:** DNS only

Wait 5 to 30 minutes. `davaus.com` will start pointing at your new site.

**Important:** do this only after you are happy with the preview. Once you switch DNS, your old site is gone.

---

## Step 4 &mdash; Ask Claude to update the site

This is the magic part. Instead of editing HTML by hand, you tell Claude what you want changed.

### 4a. Get Claude Code (recommended)

Claude Code is a tool that lets Claude read and edit files on your computer directly.

1. Install it: open Terminal, run `npm install -g @anthropic-ai/claude-code`. (If you do not have Node.js, install it from [nodejs.org](https://nodejs.org) first.)
2. Log in: run `claude` in your terminal and follow the prompts. You will need a Claude Pro or Team subscription.
3. Make sure you are using **Opus 4.7** &mdash; it is the smartest model. You can switch models with the `/model` command inside Claude Code.

### 4b. Start a session

Open your terminal, go to your repo, and start Claude:

```bash
cd ~/Documents/davaus
claude
```

Claude can now see every file in this folder.

### 4c. Talk to it like a person

Here are real prompts that will work. Copy them verbatim, tweak them for your needs.

**Update product specs:**
> "Open `site/index.html` and update the SeedRight product card. The new ROI number is 187% (not 150%). Also change the bullet 'Leave drill in shed' to 'Leave the drill in the shed where it belongs'."

**Add a new section:**
> "Add a new section to `site/index.html` between the Story and Videos sections called 'Testimonials'. Make three cards with placeholder quotes. Style it consistently with the rest of the site, using the existing CSS variables in `site/css/styles.css`. If you need new styles, add them to `site/css/index.css`."

**Swap in real images:**
> "I just uploaded `site/images/logo.svg`, `site/images/farm-photo.jpg`, and three product photos at `site/images/products/`. Find all the placeholder logo divs and image placeholders and replace them with real `<img>` tags pointing at the new files. Add `alt` text based on context."

**Add a new page:**
> "Create a new page `site/dealers.html` that lists our dealers. Use the same nav and footer as `index.html` (the mod system loads them automatically). Add a section with a placeholder dealer list &mdash; we will fill it in later. Add a 'Dealers' link to the nav in `site/components/nav.html`."

**Hook up the chatbot to a real backend:**
> "I have a backend running at `https://api.davaus.com/chat` that accepts `{message, sessionId}` and returns `{reply}`. The chatbot is already configured to hit this endpoint via `site/js/config.js`. Verify the config and walk me through testing it."

### 4d. Review and push

After Claude makes changes:

1. Preview locally (`python3 -m http.server 8000` from inside `site/`).
2. If it looks good, push to GitHub:
   ```bash
   git add .
   git commit -m "Updated product specs"
   git push
   ```
3. Railway redeploys in about 60 seconds. Refresh davaus.com to see the change.

If something is wrong, you can undo:
```bash
git reset --hard HEAD~1
git push --force
```
(That undoes the last commit and pushes the rollback.)

---

## What is in the site (so you know what you are looking at)

- `site/index.html` &mdash; your homepage
- `site/css/` &mdash; styling. `styles.css` is global, `index.css` is just the homepage
- `site/js/` &mdash; the JavaScript that powers the page
- `site/components/` &mdash; the nav bar, footer, and chatbot live here as separate files so they are easy to update once and have it propagate everywhere
- `site/images/` &mdash; drop photos and logos here

Everything is in plain HTML, CSS, and JavaScript. No build step, no framework, no magic. You can open any file in a text editor and read it.

---

## Common gotchas

**"My change is not showing up on davaus.com"** &mdash; Did you push to GitHub? Check Railway's deploy logs. Hard-refresh your browser (Cmd+Shift+R on Mac, Ctrl+Shift+R on Windows).

**"The chatbot says it cannot reach the backend"** &mdash; That is fine for now. It has built-in fallback responses about all three products. When you wire up a real backend, update `site/js/config.js` and point `chatBackend` at your endpoint.

**"I broke something and Claude cannot fix it"** &mdash; Run `git status` to see what changed, then `git checkout .` to throw away everything and start over from the last commit.

**"I want to learn more"** &mdash; Andrew has been doing this for SquidBay for over a year. Ask him. He will set you up.

---

## Andrew's rules (steal these &mdash; they work)

1. **One thing at a time.** Do not ask Claude for ten changes in one prompt. You will not be able to review them. Ask for one change, review, push, repeat.
2. **Always preview locally before pushing.** Sixty seconds of looking saves you twenty minutes of panic.
3. **No quick fixes.** If Claude offers a "for now" workaround, push back and say "no, fix it right".
4. **Read what Claude is about to change before saying yes.** Claude Code shows you a diff. Look at it.

---

Welcome to your new site. You own it now.

&mdash; built by Andrew + Claude
