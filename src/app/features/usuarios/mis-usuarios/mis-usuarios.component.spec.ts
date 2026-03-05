import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MisUsuariosComponent } from './mis-usuarios.component';

describe('MisUsuariosComponent', () => {
  let component: MisUsuariosComponent;
  let fixture: ComponentFixture<MisUsuariosComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MisUsuariosComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MisUsuariosComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
