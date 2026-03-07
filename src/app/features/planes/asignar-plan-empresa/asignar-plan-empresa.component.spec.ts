import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AsignarPlanEmpresaComponent } from './asignar-plan-empresa.component';

describe('AsignarPlanEmpresaComponent', () => {
  let component: AsignarPlanEmpresaComponent;
  let fixture: ComponentFixture<AsignarPlanEmpresaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AsignarPlanEmpresaComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AsignarPlanEmpresaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
