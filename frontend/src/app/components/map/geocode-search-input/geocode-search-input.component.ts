import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
  Renderer2,
  ViewChild,
} from '@angular/core';
import MapboxGeocoder from '@mapbox/mapbox-gl-geocoder';
import { Location } from '@rmtd/common/interfaces';
import { debounceTime, Subject, takeUntil, tap } from 'rxjs';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'geocode-search-input',
  templateUrl: './geocode-search-input.component.html',
  styleUrls: ['./geocode-search-input.component.scss'],
})
export class GeocodeSearchInputComponent implements OnInit, OnDestroy {
  @ViewChild('searchInputRef') searchInputRef: ElementRef | undefined;

  @ViewChild('searchResultsRef') searchResultsRef: ElementRef | undefined;

  @Input('showSearchResults') showSearchResults = true;

  @Output('onSearchResults') onSearchResults = new EventEmitter<Location[]>();

  showingSearchResults = false;

  searchResults: Location[] = [];

  private readonly searchSubject = new Subject<string | undefined>();

  private destroyed$ = new Subject<void>();

  private outsideClickListener: () => void;

  constructor(private renderer: Renderer2) {
    this.outsideClickListener = this.renderer.listen('window', 'click', (e: Event) => {
      if (
        this.showSearchResults &&
        e.target !== this.searchInputRef?.nativeElement &&
        e.target !== this.searchResultsRef?.nativeElement
      ) {
        this.showingSearchResults = false;
      }
    });
  }

  ngOnInit(): void {
    this.searchSubject
      .pipe(
        takeUntil(this.destroyed$),
        debounceTime(300),
        tap(async (searchQuery) => {
          this.showingSearchResults = false;
          if (searchQuery) {
            const response = await fetch(
              `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURI(
                searchQuery
              )}.json?types=address&access_token=${environment.mapboxAccessToken}`
            );
            const json: MapboxGeocoder.Results = await response.json();
            const features = json.features as MapboxGeocoder.Result[];
            this.searchResults = this.mapSearchResults(features);

            if (this.showSearchResults) {
              this.showingSearchResults = true;
            } else {
              this.onSearchResults.emit(this.searchResults);
            }
          }
        })
      )
      .subscribe();
  }

  ngOnDestroy(): void {
    this.destroyed$.next();
  }

  handleSearchResultClick(searchResult: Location): void {
    this.onSearchResults.emit([searchResult]);
    this.showingSearchResults = false;
  }

  onSearchQueryInput(event: Event): void {
    const searchQuery = (event.target as HTMLInputElement).value;
    this.searchSubject.next(searchQuery?.trim());
  }

  private mapSearchResults(rawResults: MapboxGeocoder.Result[]): Location[] {
    return rawResults.map((result: MapboxGeocoder.Result) => {
      return {
        lng: result.center[0],
        lat: result.center[1],
        postcode:
          result.context.find((ctx: { id: string }) => ctx.id.split('.')[0] === 'postcode')?.text ??
          null,
        city:
          result.context.find((ctx: { id: string }) => ctx.id.split('.')[0] === 'place')?.text ??
          null,
        district:
          result.context.find((ctx: { id: string }) => ctx.id.split('.')[0] === 'district')?.text ??
          null,
        state:
          result.context.find((ctx: { id: string }) => ctx.id.split('.')[0] === 'region')?.text ??
          null,
        country:
          result.context.find((ctx: { id: string }) => ctx.id.split('.')[0] === 'country')?.text ??
          null,
        place_name: result.place_name,
      };
    });
  }
}
