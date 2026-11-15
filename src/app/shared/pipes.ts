import { Pipe, PipeTransform } from '@angular/core';
import { photo } from '../core/data';

const formatter = new Intl.NumberFormat('en-NG', { maximumFractionDigits: 0 });

export function formatNaira(value: number): string {
  return '₦' + formatter.format(value);
}

/** 12500 → "₦12,500" */
@Pipe({ name: 'naira' })
export class NairaPipe implements PipeTransform {
  transform(value: number): string {
    return formatNaira(value);
  }
}

/** Photo id → image URL at the given width. */
@Pipe({ name: 'photo' })
export class PhotoPipe implements PipeTransform {
  transform(id: string, width = 800): string {
    return photo(id, width);
  }
}
