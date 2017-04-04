import {NgModule} from "@angular/core";
import {CommonModule} from "@angular/common";
import {FormsModule} from "@angular/forms";
import {DataTableComponent} from "./components/data-table.component";
import {ColumnDirective} from "./components/column.directive";
import {RowComponent} from "./components/row.component";
import {PaginationComponent} from "./components/pagination.component";
import {HeaderComponent} from "./components/header.component";
import {PixelConverterPipe} from "./utils/pixel-converter.pipe";
import {HideDirective} from "./utils/hide.directive";
import {MinPipe} from "./utils/min.pipe";

@NgModule({
    imports: [CommonModule, FormsModule],
    declarations: [DataTableComponent, ColumnDirective, RowComponent, PaginationComponent, HeaderComponent, PixelConverterPipe, HideDirective, MinPipe],
    exports: [DataTableComponent, ColumnDirective]
})
export class DataTableModule {
}