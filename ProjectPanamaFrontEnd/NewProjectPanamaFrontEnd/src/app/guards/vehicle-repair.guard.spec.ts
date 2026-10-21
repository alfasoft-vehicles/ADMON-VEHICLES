import { TestBed } from '@angular/core/testing';
import { CanActivateFn } from '@angular/router';

import { vehicleRepairGuard } from './vehicle-repair.guard';

describe('vehicleRepairGuard', () => {
  const executeGuard: CanActivateFn = (...guardParameters) => 
      TestBed.runInInjectionContext(() => vehicleRepairGuard(...guardParameters));

  beforeEach(() => {
    TestBed.configureTestingModule({});
  });

  it('should be created', () => {
    expect(executeGuard).toBeTruthy();
  });
});
