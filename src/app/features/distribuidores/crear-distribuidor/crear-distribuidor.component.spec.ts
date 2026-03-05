import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CrearDistribuidorComponent } from './crear-distribuidor.component';

describe('CrearDistribuidorComponent', () => {
  let component: CrearDistribuidorComponent;
  let fixture: ComponentFixture<CrearDistribuidorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CrearDistribuidorComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CrearDistribuidorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
