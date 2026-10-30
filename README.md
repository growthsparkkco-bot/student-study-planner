# StudyFlow — Student Study Planner

StudyFlow is a responsive student planner built with HTML, CSS, and vanilla JavaScript. It helps students organise study tasks, create a weekly routine, count down to exams, and track focus sessions.

## Features

- Add, complete, filter, and delete study tasks
- Track task subject, priority, date, and estimated duration
- Pomodoro-style focus timer with 25, 15, and 5-minute presets
- Add exams and see the days remaining
- Create and manage a weekly study schedule
- Dashboard statistics and a 7-day focus activity chart
- Light and dark themes
- Saves tasks, exams, schedule, and settings in browser Local Storage
- Responsive layout for desktop, tablet, and mobile

## Run locally

1. Download or clone this repository.
2. Open the project folder in VS Code.
3. Open `index.html` in your browser, or use the VS Code Live Server extension.
4. Internet access is required to load Chart.js and Google Fonts from their CDNs. The rest of the app runs in the browser.

No backend or API key is required.

## Publish with GitHub Pages

1. Create a new repository on GitHub, for example `student-study-planner`.
2. Set the repository visibility to **Public**.
3. Upload `index.html`, `style.css`, `script.js`, and `README.md` to the repository root.
4. Open **Settings → Pages**.
5. Under **Build and deployment**, choose **Deploy from a branch**.
6. Select the `main` branch and `/ (root)` folder, then save.
7. Wait for GitHub Pages to publish the site. The URL will appear in the Pages section.

## Project structure

```text
student-study-planner/
├── index.html
├── style.css
├── script.js
└── README.md
```

## Data and privacy

StudyFlow stores planner data in the current browser's Local Storage. Data is not automatically synced between devices or browsers. Clearing browser site data may remove saved planner data, so export/backup functionality should be added before using it for important records.

## Future improvements

- Export and import planner data
- Optional account login and cloud sync
- Recurring tasks and reminders
- Subject-wise analytics
- Accessibility and automated tests

## Built with

- HTML5
- CSS3
- JavaScript
- Chart.js
- Google Fonts

## License

This project is provided under the MIT License. Add a `LICENSE` file with the MIT license text if you want to distribute it under that license.
