// portfolio.component.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-portfolio',
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './portfolio.component.html',
  styleUrls: ['./portfolio.component.css']
})
export class PortfolioComponent {
  activeTab: string = 'skills';

  skills = [
    { name: 'Angular', years: 4, proficiency: 90 },
    { name: 'JavaScript', years: 5, proficiency: 95 },
    { name: 'Node.js', years: 3, proficiency: 80 },
    { name: 'TypeScript', years: 3, proficiency: 85 },
    { name: 'HTML/CSS', years: 5, proficiency: 92 },
    { name: 'React', years: 2, proficiency: 75 },
  ];

  certifications = [
    { title: 'Angular Advanced Developer', issuer: 'Google', year: 2023 },
    { title: 'AWS Solutions Architect', issuer: 'Amazon', year: 2023 },
    { title: 'Professional Scrum Master', issuer: 'Scrum.org', year: 2022 }
  ];

  projects = [
    {
      title: 'E-Commerce Platform',
      description: 'Built a full-featured e-commerce platform using Angular, Node.js and MongoDB.',
      stack: ['Angular', 'Node.js', 'MongoDB']
    },
    {
      title: 'Healthcare Dashboard',
      description: 'Developed a real-time healthcare analytics dashboard.',
      stack: ['Angular', 'TypeScript', 'D3.js']
    },
    {
      title: 'Social Media App',
      description: 'Created a social networking platform with real-time updates.',
      stack: ['Angular', 'Firebase', 'WebSockets']
    }
  ];
}
