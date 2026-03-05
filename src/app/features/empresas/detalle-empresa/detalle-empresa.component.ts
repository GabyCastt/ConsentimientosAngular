import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { EmpresaService } from '../../../core/services/empresa.service';
import { DistribuidorService, UsuarioEmpresa } from '../../../core/services/distribuidor.service';
import { EmpresaConEstadisticas } from '../../../core/models/empresa.model';
import { ToastService } from '../../../shared/services/toast.service';
import { AuthService } from '../../../core/services/auth.service';
import { ConfigService } from '../../../core/services/config.service';

@Component({
  selector: 'app-detalle-empresa',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './detalle-empresa.component.html',
  styleUrls: ['./detalle-empresa.component.scss']
})
export class DetalleEmpresaComponent implements OnInit {
  empresaId = signal<number>(0);
  empresa = signal<EmpresaConEstadisticas | null>(null);
  usuarios = signal<UsuarioEmpresa[]>([]);
  loading = signal(true);
  loadingUsuarios = signal(false);
  isAdmin = signal(false);
  isDistribuidor = signal(false);
  
  // Modal crear usuario
  mostrarModalUsuario = signal(false);
  guardandoUsuario = signal(false);
  formUsuarioEmail = signal('');
  formUsuarioPassword = signal('');
  formUsuarioNombre = signal('');

  constructor(
    private empresaService: EmpresaService,
    private distribuidorService: DistribuidorService,
    private toastService: ToastService,
    private authService: AuthService,
    private route: ActivatedRoute,
    private router: Router,
    public config: ConfigService
  ) {
    const user = this.authService.currentUser();
    this.isAdmin.set(user?.rol === 'admin');
    this.isDistribuidor.set(user?.rol === 'distribuidor');
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.empresaId.set(parseInt(id));
      this.cargarEmpresa();
      this.cargarUsuarios();
    }
  }

  cargarEmpresa(): void {
    this.loading.set(true);
    
    if (this.isAdmin()) {
      this.empresaService.obtenerEmpresa(this.empresaId()).subscribe({
        next: (response) => {
          this.empresa.set(response.empresa);
          this.loading.set(false);
        },
        error: (error) => {
          console.error('[ERROR] Error cargando empresa:', error);
          this.toastService.error('Error al cargar empresa');
          this.router.navigate(['/empresas/lista']);
        }
      });
    } else if (this.isDistribuidor()) {
      this.distribuidorService.getEstadisticasEmpresa(this.empresaId()).subscribe({
        next: (response) => {
          this.empresa.set({
            id: response.empresa.id,
            nombre: response.empresa.nombre,
            logo: response.empresa.logo || undefined,
            slogan: response.empresa.slogan || undefined,
            estadisticas: response.estadisticas
          });
          this.loading.set(false);
        },
        error: (error) => {
          console.error('[ERROR] Error cargando empresa:', error);
          this.toastService.error('Error al cargar empresa');
          this.router.navigate(['/empresas/lista']);
        }
      });
    }
  }

  cargarUsuarios(): void {
    this.loadingUsuarios.set(true);
    
    this.distribuidorService.getUsuariosEmpresa(this.empresaId()).subscribe({
      next: (response) => {
        this.usuarios.set(response.usuarios);
        this.loadingUsuarios.set(false);
      },
      error: (error) => {
        console.error('[ERROR] Error cargando usuarios:', error);
        this.loadingUsuarios.set(false);
      }
    });
  }

  abrirModalCrearUsuario(): void {
    this.formUsuarioEmail.set('');
    this.formUsuarioPassword.set('');
    this.formUsuarioNombre.set('');
    this.mostrarModalUsuario.set(true);
  }

  cerrarModalUsuario(): void {
    this.mostrarModalUsuario.set(false);
  }

  crearUsuario(): void {
    if (!this.formUsuarioEmail().trim() || !this.formUsuarioPassword().trim() || !this.formUsuarioNombre().trim()) {
      this.toastService.error('Todos los campos son requeridos');
      return;
    }

    if (this.formUsuarioPassword().length < 6) {
      this.toastService.error('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    this.guardandoUsuario.set(true);

    const data = {
      email: this.formUsuarioEmail(),
      password: this.formUsuarioPassword(),
      nombre: this.formUsuarioNombre()
    };

    this.distribuidorService.crearUsuarioEmpresa(this.empresaId(), data).subscribe({
      next: (response) => {
        this.toastService.success('Usuario creado correctamente');
        this.cerrarModalUsuario();
        this.cargarUsuarios();
        this.guardandoUsuario.set(false);
      },
      error: (error) => {
        console.error('[ERROR] Error creando usuario:', error);
        this.toastService.error(error.error?.error || 'Error al crear usuario');
        this.guardandoUsuario.set(false);
      }
    });
  }

  toggleUsuarioActivo(usuario: UsuarioEmpresa): void {
    const nuevoEstado = !usuario.activo;
    
    this.distribuidorService.actualizarUsuarioEmpresa(this.empresaId(), usuario.id, {
      activo: nuevoEstado
    }).subscribe({
      next: () => {
        this.toastService.success(`Usuario ${nuevoEstado ? 'activado' : 'desactivado'} correctamente`);
        this.cargarUsuarios();
      },
      error: (error) => {
        console.error('[ERROR] Error actualizando usuario:', error);
        this.toastService.error('Error al actualizar usuario');
      }
    });
  }

  eliminarUsuario(usuario: UsuarioEmpresa): void {
    if (!confirm(`¿Estás seguro de eliminar al usuario ${usuario.nombre}?`)) {
      return;
    }

    this.distribuidorService.eliminarUsuarioEmpresa(this.empresaId(), usuario.id).subscribe({
      next: () => {
        this.toastService.success('Usuario eliminado correctamente');
        this.cargarUsuarios();
      },
      error: (error) => {
        console.error('[ERROR] Error eliminando usuario:', error);
        this.toastService.error('Error al eliminar usuario');
      }
    });
  }

  editarEmpresa(): void {
    this.router.navigate(['/empresas/editar', this.empresaId()]);
  }

  volver(): void {
    this.router.navigate(['/empresas/lista']);
  }

  getLogoUrl(): string | null {
    const emp = this.empresa();
    return emp?.logo ? this.config.getLogoUrl(emp.logo) : null;
  }

  formatDate(dateString: string | undefined): string {
    if (!dateString) return 'N/A';
    return this.config.formatearTiempoRelativo(dateString);
  }
}
