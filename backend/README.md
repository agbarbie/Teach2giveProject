backend/
├── src/
│   ├── controllers/
│   │   ├── ApplicationController.ts
│   │   ├── AuthController.ts
│   │   ├── CompanyController.ts
│   │   ├── InterviewRequestController.ts
│   │   ├── JobController.ts
│   │   ├── JobMatchController.ts
│   │   ├── JobSeekerProfileController.ts
│   │   ├── LearningResourceController.ts
│   │   ├── SkillController.ts
│   │   └── UserController.ts
│   ├── db/
│   │   └── db.config.ts
│   ├── middlewares/
│   │   ├── asynchandlers.ts
│   │   ├── errorMiddlewares.ts
│   │   └── protect.ts
│   ├── routes/
│   │   ├── application.ts
│   │   ├── auth.routes.ts
│   │   ├── companies.ts
│   │   ├── interviewRequests.ts
│   │   ├── job.ts
│   │   ├── jobSeekerProfile.ts
│   │   ├── match.ts
│   │   ├── resource.ts
│   │   ├── skills.ts
│   │   └── user.ts
│   └── utils/
│       └── helpers/

sudo docker stop backendusers-fixed
sudo docker rm backendusers-fixed
sudo docker run -d --name backendusers-fixed \
  -p 80:80 \
  -e DB_HOST=skillmatchesai1.clys68qy6l9q.eu-north-1.rds.amazonaws.com \
  -e DB_PORT=5432 \
  -e DB_USER=postgres \
  -e DB_NAME=skillmatchesai1 \
  -e DB_PASSWORD=Barbie1620 \
  -e DB_SSL=true \
  barbkoi/backendusers-fixed:latest
