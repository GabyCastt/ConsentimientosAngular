import { TestBed } from '@angular/core/testing';

import { DiditService } from './didit.service';

describe('DiditService', () => {
  let service: DiditService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DiditService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
