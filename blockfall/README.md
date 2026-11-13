# Blockfall

A mobile-first falling-block game built with TypeScript, Vite and Canvas. It runs in the browser and can be added to an iPhone Home Screen.

## Run on your Mac

Install Node.js 22 or newer. Open Terminal in the extracted `blockfall` folder, then run:

```sh
npm ci
npm run dev
```

Open the address Vite prints, usually http://localhost:5173. To try touch controls over Wi-Fi, run `npm run dev -- --host 0.0.0.0` and open the printed Network address in Safari on an iPhone connected to the same network.

## Play

| Action | Keyboard | Touch |
| --- | --- | --- |
| Move | Left / Right | ← / → |
| Soft drop | Down | ↓ |
| Rotate | Up clockwise, Z counterclockwise | ↻ clockwise |
| Hard drop | Space | Drop |
| Pause / resume | P or Escape | Pause / Resume |

Hold a direction or soft drop to repeat. The ghost shows the landing position. The next-piece preview uses a shuffled seven-piece bag. A soft drop earns 1 point per row and a hard drop earns 2. Clearing 1–4 lines at once earns 100, 300, 500 or 800 points multiplied by the current level. Gravity speeds up every 10 lines. The best score is saved in the current browser's local storage.

## Continue a saved game

Blockfall saves one unfinished run in the current browser after every move and gravity step. Reopen the same URL or Home Screen app, tap **Continue** to review the paused board, then tap **Resume**. **New Game** asks before replacing the save, and game over clears it. Your best score is stored separately. Saves work offline and stay in the browser or installed app where you played.

## Test and build

```sh
npm test
npm run build
npm run preview
```

The build writes `dist/`. To test offline on your Mac, open the preview URL (usually http://localhost:4173), wait for the service worker to activate, then start a game, make a move, then switch the browser's network to Offline and reload. Choose **Continue** and verify the board and score before resuming. The Wi-Fi development address uses HTTP and is for testing touch controls. Use the HTTPS deployment for iPhone installation and offline play.

## Deploy to GitHub Pages

1. Create a GitHub repository and push the contents of this folder to its `main` branch. Keep the hidden `.github` directory at the repository root.
2. Open the repository's **Settings → Pages** and select **GitHub Actions** under **Build and deployment → Source**.
3. Open **Actions**, select **Deploy to GitHub Pages**, and choose **Run workflow** on `main`. Future pushes to `main` trigger deployment automatically.
4. Open the URL shown by the completed deployment. Relative asset paths support both repository URLs and root-level sites.

See the [Vite GitHub Pages guide](https://vite.dev/guide/static-deploy.html#github-pages).

## Add it to your iPhone

Open the deployed HTTPS URL in Safari. In the Share menu, choose **Add to Home Screen**, turn on **Open as Web App** if shown, and tap **Add**. Launch it from the Home Screen once while online so it can cache the game for offline play. After a new deployment, closing and reopening the app lets the updated service worker take over once older game tabs are closed.

See [Apple's Home Screen web app guide](https://support.apple.com/en-gb/guide/iphone/iphea86e5236/ios).
