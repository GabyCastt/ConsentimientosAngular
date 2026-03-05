import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UsuariosEmpresaComponent } from './usuarios-empresa.component';

describe('UsuariosEmpresaComponent', () => {
  let component: UsuariosEmpresaComponent;
  let fixture: ComponentFixture<UsuariosEmpresaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UsuariosEmpresaComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UsuariosEmpresaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
