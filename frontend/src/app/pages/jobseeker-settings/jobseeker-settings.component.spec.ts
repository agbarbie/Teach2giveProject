import { ComponentFixture, TestBed } from '@angular/core/testing';

import { JobseekerSettingsComponent } from './jobseeker-settings.component';

describe('JobseekerSettingsComponent', () => {
  let component: JobseekerSettingsComponent;
  let fixture: ComponentFixture<JobseekerSettingsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [JobseekerSettingsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(JobseekerSettingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
