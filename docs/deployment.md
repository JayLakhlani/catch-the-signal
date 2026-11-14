# Deployment guide

Set up a fresh Vercel project and Google workspace for the connected study. The standalone preview can be used without either service.

## One-time team setup

### 1. Create the GitHub repository

Create a new empty repository in your own GitHub account. Public or private is fine. Upload the CONTENTS of this folder at the repository root: public/, api/, lib/, google/, tests/, package.json and vercel.json. Do not upload a containing folder as the only root entry. Keep `.env.example`; never upload a real `.env` or any actual secret.

If using Git locally, commit the folder and push it to the empty repository using GitHub's instructions. No provider credentials are included in this package.

### 2. Import it into Vercel

Choose Add New Project and import that GitHub repository. Use the free Hobby plan if your project meets its non-commercial personal-use terms. Framework preset: Other. Root directory: repository root. No install or build command is needed. Output directory: public. Deploy once to obtain your project URL. Until setup is completed, the live page deliberately says the study is not available and blocks real participation.

The supplied server endpoints remain in api/ at the repository root. Do not turn this into a static-only deployment that excludes those endpoints. An optional custom domain is not required; the included vercel.app address works.

### 3. Create the Google Apps Script project

Open https://script.google.com/ in the Google account that will own the research data and create a new project. Paste google/Code.gs into Code.gs. In Project Settings enable Show appsscript.json manifest file, then copy google/appsscript.json into that file.

In Project Settings > Script properties, add:

| Property | Value |
| --- | --- |
| WEBSITE_URL | Your actual https://...vercel.app URL |
| RESEARCHER_CONTACT | Group 57 |
| SUPERVISOR_CONTACT | Optional supervisor contact, if supplied |
| RETENTION | Optional agreed storage and deletion period |
| Withdrawal policy | Submitted responses cannot be withdrawn; this is stated before submission |
| STUDY_DATES | Optional recruitment dates, if supplied |
| STUDY_SHARED_SECRET | A new random secret of at least 32 characters |

Generate a random secret using a password manager. Do not use a participant code or ordinary password. Keep this secret in Script properties and Vercel's server environment settings only. Never put it in public/, the browser console, a GitHub issue or a committed file.

Run setupStudy once and grant the requested Forms and Sheets permissions in your own Google account. It creates a new Form and spreadsheet owned by you. The script prints the spreadsheet URL, and its Setup tab contains the resource links. The script reuses the saved IDs if rerun. Existing questions are reused by title. After you edit question titles manually, avoid rerunning setup unless you intend it to restore those original questions.

### 4. Review and publish the Form

Open the Form editor from the spreadsheet's Setup tab. Review the wording and participant audience, then publish it for your intended respondents. If participants should not need a Google login, check the responder permissions and test that flow in a signed-out browser. Account or institution policies may restrict public access. The setup turns off email collection, response editing, the public response summary, and the one-response-per-Google-account limit.

Keep the RESULTS SPREADSHEET private to the research team. Publishing the respondent Form does not require making its spreadsheet public.

### 5. Deploy the Google receiver

In the Apps Script editor choose Deploy > New deployment > Web app. Execute as: Me (the data owner). Access: Anyone, where your account permits it. This lets the Vercel server call the receiver; submitted payloads still require the shared signature. Review the Google permission prompts yourself. Copy the deployed /exec URL. If institutional policy prevents a publicly callable Apps Script web app, this route will not work under that account; use an allowed account or the database alternative below.

### 6. Set Vercel's two server environment values

- GOOGLE_SCRIPT_URL = the deployed https://script.google.com/macros/s/.../exec URL.
- STUDY_SHARED_SECRET = exactly the secret from Script properties.

Add these to the Vercel project environment settings. Do not use a NEXT_PUBLIC_ prefix. Set the intended deployment environments and redeploy. In Apps Script, set the Script property STUDY_OPEN to true only when the study is ready to test/collect. Code changes to the Apps Script receiver require a new web-app version under Manage deployments; changing Script properties does not require a new version.

### 7. Run a complete pilot before sharing the link

Run one fictional participant all the way through the game, all three duration questions, and the Google Form. Check for 38 trial rows, 3 stage rows, one complete Sessions row and one Form response with the same code. Refresh after completion and confirm it does not create duplicate rows. Test a disconnected save and retry: completed results should retry automatically without another game. Identify your pilot codes so those rows are excluded from actual analysis. Confirm the Form and website work for someone who is not signed into the owner's Google account.

For a second pilot participant on the same machine, use a separate browser profile. The browser remembers the completed participant to prevent accidental repeat attempts. Participants should use one session on one device. Do not share a profile between participants without the research team first clearing that site's local storage.
