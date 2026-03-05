import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DetalleDistribuidorComponent } from './detalle-distribuidor.component';

describe('DetalleDistribuidorComponent', () => {
  let component: DetalleDistribuidorComponent;
  let fixture: ComponentFixture<DetalleDistribuidorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DetalleDistribuidorComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DetalleDistribuidorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
