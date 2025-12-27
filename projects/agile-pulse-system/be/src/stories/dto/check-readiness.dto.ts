export class CheckReadinessResponseDto {
  status: 'Ready' | 'Incomplete';
  isReady: boolean;
  failedChecks: string[];
  checklist: {
    points: {
      value: number | null;
      required: boolean;
      passed: boolean;
    };
    priority: {
      value: string;
      required: boolean;
      passed: boolean;
    };
    estimation: {
      value: number | null;
      required: boolean;
      passed: boolean;
    };
    tests: {
      value: boolean;
      required: boolean;
      passed: boolean;
    };
    blockers: {
      value: boolean;
      required: boolean;
      passed: boolean;
    };
    mvpTag: {
      value: boolean;
      required: boolean;
      passed: boolean;
    };
  };
}

