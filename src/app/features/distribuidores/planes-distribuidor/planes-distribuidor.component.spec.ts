import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PlanesDistribuidorComponent } from './planes-distribuidor.component';

describe('PlanesDistribuidorComponent', () => {
  let component: PlanesDistribuidorComponent;
  let fixture: ComponentFixture<PlanesDistribuidorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PlanesDistribuidorComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PlanesDistribuidorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
