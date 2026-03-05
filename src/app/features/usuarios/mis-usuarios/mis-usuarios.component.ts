import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UsuariosService } from '../../../core/services/usuarios.service';
import { UsuarioEmpresa, CrearUsuarioRequest, ActualizarUsuarioRequest } from '../../../core/models/usuario-empresa.model';

@Component({
  selector: 'app-mis-usuarios',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './mis-usuarios.component.html',
  styleUrl: './mis-usuarios.component.scss'
})
export class MisUsuariosComponent implements OnInit {
  usuarios: UsuarioEmpresa[] = [];
  loading = false;
  error = '';
  successMessage = '';

  // Modal crear/editar
  showModal = false;
  modalMode: 'crear' | 'editar' = 'crear';
  usuarioEditando: UsuarioEmpresa | null = null;

  // Formulario
  formData: Partial<CrearUsuarioRequest & ActualizarUsuarioRequest> = {
    nombre: '',
    email: '',
    password: '',
    activo: true
  };

  // Modal cambiar contraseña
  showPasswordModal = false;
  usuarioPassword: UsuarioEmpresa | null = null;
  nuevaPassword = '';

  constructor(private usuariosService: UsuariosService) {}

  ngOnInit(): void {
    this.cargarUsuarios();
  }

  cargarUsuarios(): void {
    this.loading = true;
    this.error = '';

    this.usuariosService.listarMisUsuarios().subscribe({
      next: (response) => {
        this.usuarios = response.usuarios;
        this.loading = false;
      },
      error: (err) => {
        this.error = err.error?.error || 'Error al cargar usuarios';
        this.loading = false;
      }
    });
  }

  abrirModalCrear(): void {
    this.modalMode = 'crear';
    this.usuarioEditando = null;
    this.formData = {
      nombre: '',
      email: '',
      password: '',
      activo: true
    };
    this.showModal = true;
    this.error = '';
    this.successMessage = '';
  }

  abrirModalEditar(usuario: UsuarioEmpresa): void {
    this.modalMode = 'editar';
    this.usuarioEditando = usuario;
    this.formData = {
      nombre: usuario.nombre,
      email: usuario.email,
      activo: usuario.activo
    };
    this.showModal = true;
    this.error = '';
    this.successMessage = '';
  }

  cerrarModal(): void {
    this.showModal = false;
    this.usuarioEditando = null;
  }

  guardarUsuario(): void {
    if (this.modalMode === 'crear') {
      this.crearUsuario();
    } else {
      this.actualizarUsuario();
    }
  }

  crearUsuario(): void {
    if (!this.formData.nombre || !this.formData.email || !this.formData.password) {
      this.error = 'Todos los campos son obligatorios';
      return;
    }

    this.loading = true;
    this.error = '';

    const data: CrearUsuarioRequest = {
      nombre: this.formData.nombre,
      email: this.formData.email,
      password: this.formData.password
    };

    this.usuariosService.crearMiUsuario(data).subscribe({
      next: (response) => {
        this.successMessage = response.message;
        this.loading = false;
        this.cerrarModal();
        this.cargarUsuarios();
        setTimeout(() => this.successMessage = '', 3000);
      },
      error: (err) => {
        this.error = err.error?.error || 'Error al crear usuario';
        this.loading = false;
      }
    });
  }

  actualizarUsuario(): void {
    if (!this.usuarioEditando || !this.formData.nombre || !this.formData.email) {
      this.error = 'Nombre y email son obligatorios';
      return;
    }

    this.loading = true;
    this.error = '';

    const data: ActualizarUsuarioRequest = {
      nombre: this.formData.nombre,
      email: this.formData.email,
      activo: this.formData.activo ? 1 : 0
    };

    this.usuariosService.actualizarMiUsuario(this.usuarioEditando.id, data).subscribe({
      next: (response) => {
        this.successMessage = response.message;
        this.loading = false;
        this.cerrarModal();
        this.cargarUsuarios();
        setTimeout(() => this.successMessage = '', 3000);
      },
      error: (err) => {
        this.error = err.error?.error || 'Error al actualizar usuario';
        this.loading = false;
      }
    });
  }

  eliminarUsuario(usuario: UsuarioEmpresa): void {
    if (!confirm(`¿Está seguro de eliminar al usuario ${usuario.nombre}?`)) {
      return;
    }

    this.loading = true;
    this.error = '';

    this.usuariosService.eliminarMiUsuario(usuario.id).subscribe({
      next: (response) => {
        this.successMessage = response.message;
        this.loading = false;
        this.cargarUsuarios();
        setTimeout(() => this.successMessage = '', 3000);
      },
      error: (err) => {
        this.error = err.error?.error || 'Error al eliminar usuario';
        this.loading = false;
      }
    });
  }

  abrirModalPassword(usuario: UsuarioEmpresa): void {
    this.usuarioPassword = usuario;
    this.nuevaPassword = '';
    this.showPasswordModal = true;
    this.error = '';
  }

  cerrarModalPassword(): void {
    this.showPasswordModal = false;
    this.usuarioPassword = null;
    this.nuevaPassword = '';
  }

  cambiarPassword(): void {
    if (!this.usuarioPassword || !this.nuevaPassword) {
      this.error = 'La contraseña es obligatoria';
      return;
    }

    if (this.nuevaPassword.length < 6) {
      this.error = 'La contraseña debe tener al menos 6 caracteres';
      return;
    }

    this.loading = true;
    this.error = '';

    this.usuariosService.cambiarPasswordMiUsuario(
      this.usuarioPassword.id,
      { password: this.nuevaPassword }
    ).subscribe({
      next: (response) => {
        this.successMessage = response.message;
        this.loading = false;
        this.cerrarModalPassword();
        setTimeout(() => this.successMessage = '', 3000);
      },
      error: (err) => {
        this.error = err.error?.error || 'Error al cambiar contraseña';
        this.loading = false;
      }
    });
  }

  getEstadoClass(activo: number | boolean): string {
    return activo ? 'badge-success' : 'badge-danger';
  }

  getEstadoTexto(activo: number | boolean): string {
    return activo ? 'Activo' : 'Inactivo';
  }
}
