import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ListaDistribuidoresComponent } from './lista-distribuidores.component';

describe('ListaDistribuidoresComponent', () => {
  let component: ListaDistribuidoresComponent;
  let fixture: ComponentFixture<ListaDistribuidoresComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ListaDistribuidoresComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ListaDistribuidoresComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
