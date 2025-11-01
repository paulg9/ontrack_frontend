# OnTrack Frontend

This repository hosts the Vue 3 + Vite application for the OnTrack client.

## Getting Started
- Install dependencies: `npm install`
- Start the dev server: `npm run dev`
- The app expects the backend to be reachable at `http://localhost:8000/api`

## API Reference
- The backend OpenAPI-style reference is copied from the server repo into `backend.api.md`
- Environment variables for API access live in `.env`; by default `VITE_API_BASE_URL=http://localhost:8000/api`

## Tooling
- Recommended editor extension: Volar (see `.vscode/extensions.json`)
- Vite configuration can be found in `vite.config.js`


# User Journey

An admin wants to build the exercise library for their rehab app. They open the Exercise Library page and click “Add Exercise.” They give the new exercise a name and can choose to add a video link or written description. If they leave those blank, they can click "Fill with AI” to have the app fill in the details(the ai wont always find a video, in which case there wont be one). The admin reviews the AI’s output and either approves or denies it. Once satisfied, they save the exercise, and it appears in the shared library for future plans.

A user creates an account and signs in. From their dashboard, they open the “Build Rehab Plan” page and select exercises from the library to create their personalized plan, setting target reps, sets, and per week numbers. There is also an optional notes box where they can put some extra details. The plan with the desired frequencies and optional note is added to their plan. During recovery, the user checks in daily by marking which exercises they completed and rating their strain and pain levels with the sliders. They can view or download their progress to track improvement over time. When viewing any exercise in their plan, the user can see cues or watch the linked video (if provided) for guidance.

By the end of this journey, the admin has expanded the exercise library, and the user has a structured, trackable rehab plan built from it.

# Design Study
You can view the full design study here: [DesignStudySlides.pdf](DesignStudySlides.pdf)


# Screen Recording
My screen recording can be viewed here (play at 2x speed): 
https://drive.google.com/file/d/18QGGHwdZIm_82tTsP8Xf4poH3J5w_oAR/view?usp=sharing
