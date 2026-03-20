import { inject } from '@angular/core';
import { Routes } from '@angular/router';
import { DashboardFacade } from './features/dashboard/dashboard.service';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full',
  },
  {
    path: 'dashboard',
    loadComponent: () =>
      import('./features/dashboard/dashboard.component').then((m) => m.DashboardComponent),
    resolve: {
      refreshData: () => {
        const facade = inject(DashboardFacade);
        if (!!facade.dashboardResource.value()) {
          console.log('refreshing data');
          facade.refreshData();
        }
        return true;
      },
    },
  },
  {
    path: 'property/new',
    loadComponent: () =>
      import('./features/properties/property-create.component').then(
        (m) => m.PropertyCreateComponent,
      ),
  },
  {
    path: 'properties/:propId',
    loadComponent: () =>
      import('./features/properties/property-detail.component').then(
        (m) => m.PropertyDetailComponent,
      ),
  },
  {
    path: 'properties/:propId/months/:monthId',
    loadComponent: () =>
      import('./features/months/month-form.component').then((m) => m.MonthFormComponent),
  },
];
