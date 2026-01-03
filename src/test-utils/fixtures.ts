import { ApplicantProfile } from '../domain/types';

export const baseApplicantProfile: ApplicantProfile = {
  id: 'profile-1',
  tenant_id: 'tenant-1',
  profile_version: 1,
  collected_at: '2025-01-01T00:00:00.000Z',
  created_at: new Date('2025-01-01T00:00:00.000Z'),
  data: {
    person: {
      date_of_birth: '1990-01-01',
      nationality: 'AUS',
      marital_status: 'married'
    },
    location: {
      current_country: 'AUS',
      current_state: 'NSW',
      regional_postcode: '2000'
    },
    visa_history: {
      current_visa_subclass: '500',
      visa_expiry_date: '2025-12-01',
      previous_refusals: false,
      previous_cancellations: false,
      compliance_issues: false,
      notes: ''
    },
    occupation: {
      anzsco_code: '261313',
      occupation_title: 'Software Engineer',
      skills_assessment: {
        status: 'positive',
        assessing_authority: 'ACS',
        issue_date: '2024-01-01',
        expiry_date: '2027-01-01',
        notes: ''
      }
    },
    english: {
      test_type: 'IELTS',
      overall: 7.5,
      listening: 7.5,
      reading: 7.5,
      writing: 7.0,
      speaking: 7.5,
      test_date: '2024-06-01'
    },
    education: [
      {
        level: 'bachelor',
        field: 'Computer Science',
        country: 'AUS',
        completed_date: '2015-12-01'
      }
    ],
    employment: [
      {
        employer: 'ABC Pty Ltd',
        country: 'AUS',
        start_date: '2018-01-01',
        end_date: null,
        hours_per_week: 38,
        employment_type: 'full_time',
        role_title: 'Engineer',
        duties_alignment: 'high',
        evidence_strength: 'strong'
      }
    ],
    points_claim: {
      total_points_claimed: 80,
      age_points: 30,
      english_points: 10,
      education_points: 15,
      australian_experience_points: 10,
      overseas_experience_points: 0,
      partner_points: 0,
      naati_points: 0,
      professional_year_points: 0,
      regional_study_points: 0,
      state_nomination_points: 0
    },
    state_nomination: {
      seeking_nomination: false,
      state: 'NSW',
      occupation_list_status: 'on_list',
      notes: ''
    },
    documents: {
      passport: true,
      skills_assessment: true,
      english_test: true,
      employment_reference_letters: true,
      employment_contracts: true,
      payslips: true,
      bank_statements: true,
      cv: true
    }
  }
};

type DeepProfileOverrides = Partial<Omit<ApplicantProfile, 'data'>> & {
  data?: {
    person?: Partial<ApplicantProfile['data']['person']>;
    location?: Partial<ApplicantProfile['data']['location']>;
    visa_history?: Partial<ApplicantProfile['data']['visa_history']>;
    occupation?: Partial<Omit<ApplicantProfile['data']['occupation'], 'skills_assessment'>> & {
      skills_assessment?: Partial<ApplicantProfile['data']['occupation']['skills_assessment']>;
    };
    english?: Partial<ApplicantProfile['data']['english']>;
    education?: ApplicantProfile['data']['education'];
    employment?: ApplicantProfile['data']['employment'];
    points_claim?: Partial<ApplicantProfile['data']['points_claim']>;
    state_nomination?: Partial<ApplicantProfile['data']['state_nomination']>;
    documents?: Partial<ApplicantProfile['data']['documents']>;
  };
};

export function cloneProfile(overrides: DeepProfileOverrides = {}): ApplicantProfile {
  return {
    ...baseApplicantProfile,
    ...overrides,
    id: overrides.id ?? baseApplicantProfile.id,
    tenant_id: overrides.tenant_id ?? baseApplicantProfile.tenant_id,
    profile_version: overrides.profile_version ?? baseApplicantProfile.profile_version,
    collected_at: overrides.collected_at ?? baseApplicantProfile.collected_at,
    created_at: overrides.created_at ?? baseApplicantProfile.created_at,
    data: {
      ...baseApplicantProfile.data,
      ...(overrides.data ?? {}),
      person: {
        ...baseApplicantProfile.data.person,
        ...(overrides.data?.person ?? {})
      },
      location: {
        ...baseApplicantProfile.data.location,
        ...(overrides.data?.location ?? {})
      },
      visa_history: {
        ...baseApplicantProfile.data.visa_history,
        ...(overrides.data?.visa_history ?? {})
      },
      occupation: {
        ...baseApplicantProfile.data.occupation,
        ...(overrides.data?.occupation ?? {}),
        skills_assessment: {
          ...baseApplicantProfile.data.occupation.skills_assessment,
          ...(overrides.data?.occupation?.skills_assessment ?? {})
        }
      },
      english: {
        ...baseApplicantProfile.data.english,
        ...(overrides.data?.english ?? {})
      },
      education: overrides.data?.education ?? baseApplicantProfile.data.education,
      employment: overrides.data?.employment ?? baseApplicantProfile.data.employment,
      points_claim: {
        ...baseApplicantProfile.data.points_claim,
        ...(overrides.data?.points_claim ?? {})
      },
      state_nomination: {
        ...baseApplicantProfile.data.state_nomination,
        ...(overrides.data?.state_nomination ?? {})
      },
      documents: {
        ...baseApplicantProfile.data.documents,
        ...(overrides.data?.documents ?? {})
      }
    }
  };
}
