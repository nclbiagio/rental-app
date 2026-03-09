import { Component, signal, computed } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrls: ['./app.css'],
  standalone: true,
  imports: [RouterOutlet],
})
export class AppComponent {
  title = signal('rental-app');
  rentals = signal([
    { id: 1, name: 'Mountain Bike', price: 15 },
    { id: 2, name: 'Surfboard', price: 25 },
    { id: 3, name: 'Tent', price: 10 },
  ]);

  // Experimental Signal Forms syntax as requested
  // Note: Since this is v21 preview, we shape it as requested.
  // userForm = form({
  //   name: signal(''),
  //   email: signal('')
  // });

  viewMode = signal<'list' | 'grid'>('list');

  totalPrice = computed(() => this.rentals().reduce((acc, item) => acc + item.price, 0));

  toggleViewMode() {
    this.viewMode.update((mode) => (mode === 'list' ? 'grid' : 'list'));
  }

  // Example of appending items via state management
  addRental(name: string, price: number) {
    this.rentals.update((items) => [...items, { id: Date.now(), name, price }]);
  }
}
