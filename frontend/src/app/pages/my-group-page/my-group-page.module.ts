import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { UserAvatarModule } from 'src/app/components/icons/user-avatar/user-avatar.module';
import { AccordionModule } from 'src/app/components/misc/accordion/accordion.module';
import { SidebarSliderModule } from 'src/app/components/misc/sidebar-slider/sidebar-slider.module';
import { MyGroupPageComponent } from './my-group-page.component';

@NgModule({
  declarations: [MyGroupPageComponent],
  imports: [CommonModule, SidebarSliderModule, AccordionModule, UserAvatarModule],
})
export class MyGroupPageModule {}
