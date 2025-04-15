import { Component } from '@angular/core';
import { Router,RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-about-us',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './about-us.component.html',
  styleUrls: ['./about-us.component.css']
})
export class AboutUsComponent {
  faqs = [
    {
      question: 'What is the minimum company size required to use SkillMatch AI?',
      answer: ''
    },
    {
      question: 'How accurately is your AI matching system?',
      answer: 'Our AI matching system has a 95% accuracy rate in pairing candidates with suitable roles based on both technical skills and cultural fit.'
    },
    {
      question: 'What is the average time-to-hire using SkillMatch AI?',
      answer: 'Companies using SkillMatch AI reduce their time-to-hire by an average of 40% compared to traditional recruitment methods.'
    },
    {
      question: 'How do you handle data privacy and security?',
      answer: 'We adhere to strict data protection regulations including GDPR and employ enterprise-grade encryption for all data.'
    },
    {
      question: 'What integration options are available?',
      answer: 'We integrate with popular HR systems, LinkedIn, and provide a comprehensive API for custom integrations.'
    },
    {
      question: 'How do you ensure diversity and inclusion in the matching process?',
      answer: 'Our AI is trained to eliminate bias and we provide diversity analytics to help companies meet their inclusion goals.'
    },
    {
      question: 'What support options are available?',
      answer: 'We offer 24/7 support with dedicated account managers for enterprise clients.'
    },
    {
      question: 'What is your pricing model?',
      answer: 'We offer flexible pricing based on company size and needs, including pay-per-hire and subscription options.'
    }
  ];

  leadershipTeam = [
    {
      name: 'Sarah Anderson',
      position: 'CEO & Product',
      bio: 'Visionary leader with 15+ years in HR tech innovation'
    },
    {
      name: 'Michael Zhang',
      position: 'CFO',
      bio: 'Financial strategist specializing in AI startups'
    },
    {
      name: 'Elena Rodriguez',
      position: 'Head of Product',
      bio: 'Product development expert focused on user experience'
    }
  ];

  constructor(private router: Router) {}

  navigateTo(path: string): void {
    this.router.navigate([path]);
  }
}