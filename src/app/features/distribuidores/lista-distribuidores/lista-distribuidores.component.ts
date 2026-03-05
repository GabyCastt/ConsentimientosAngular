import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AdminService } from '../../../core/services/admin.service';
import { Distribuidor } from '../../../core/models/distribuidor.model';

@Component({
  selector: 'app-lista-distribuidores',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './lista-distribuidores.component.html',
  styleUrls: ['./lista-distribuidores.component.scss']
})
export class ListaDistribuidoresComponent implements OnInit {
  distribuidores: Distribuidor[] = [];
  loading = false;
  error: string | null = null;

  constructor(
    private adminService: AdminService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.cargarDistribuidores();
  }

  cargarDistribuidores(): void {
    this.loading = true;
    this.error = null;

    this.adminService.getDistribuidores().subscribe({
      next: (response) => {
        this.distribuidores = response.distribuidores;
        this.loading = false;
      },
      error: (err) => {
        this.error = err.error?.error || 'Error al cargar distribuidores';
        this.loading = false;
      }
    });
  }

  verDetalle(id: number): void {
    this.router.navigate(['/distribuidores/detalle', id]);
  }

  editarDistribuidor(id: number): void {
    this.router.navigate(['/distribuidores/editar', id]);
  }

  eliminarDistribuidor(distribuidor: Distribuidor): void {
    if (!confirm(`¿Estás seguro de eliminar al distribuidor "${distribuidor.nombre}"?`)) {
      return;
    }

    this.adminService.eliminarDistribuidor(distribuidor.id).subscribe({
      next: () => {
        this.cargarDistribuidores();
      },
      error: (err) => {
        alert(err.error?.error || 'Error al eliminar distribuidor');
      }
    });
  }

  toggleActivo(distribuidor: Distribuidor): void {
    const nuevoEstado = !distribuidor.activo;
    const mensaje = nuevoEstado ? 'activar' : 'desactivar';

    if (!confirm(`¿Estás seguro de ${mensaje} al distribuidor "${distribuidor.nombre}"?`)) {
      return;
    }

    this.adminService.actualizarDistribuidor(distribuidor.id, { activo: nuevoEstado }).subscribe({
      next: () => {
        this.cargarDistribuidores();
      },
      error: (err) => {
        alert(err.error?.error || `Error al ${mensaje} distribuidor`);
      }
    });
  }
}
