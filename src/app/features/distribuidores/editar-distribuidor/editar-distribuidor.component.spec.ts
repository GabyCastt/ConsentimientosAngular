import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EditarDistribuidorComponent } from './editar-distribuidor.component';

describe('EditarDistribuidorComponent', () => {
  let component: EditarDistribuidorComponent;
  let fixture: ComponentFixture<EditarDistribuidorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditarDistribuidorComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EditarDistribuidorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
