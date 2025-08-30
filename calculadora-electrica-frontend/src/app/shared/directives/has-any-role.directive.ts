import { Directive, Input, TemplateRef, ViewContainerRef } from '@angular/core';
import { AuthService } from '../../core/services/auth/auth.service';

@Directive({
  selector: '[hasAnyRole]',
  standalone: true
})
export class HasAnyRoleDirective {
  private hasView = false;

  constructor(
    private templateRef: TemplateRef<any>,
    private viewContainer: ViewContainerRef,
    private authService: AuthService
  ) {}

  @Input() set hasAnyRole(roles: string[]) {
    const user = this.authService.getCurrentUser();
    
    if (!user || !user.role) {
      this.viewContainer.clear();
      this.hasView = false;
      return;
    }

    const hasAnyRole = roles.includes(user.role);

    if (hasAnyRole && !this.hasView) {
      this.viewContainer.createEmbeddedView(this.templateRef);
      this.hasView = true;
    } else if (!hasAnyRole && this.hasView) {
      this.viewContainer.clear();
      this.hasView = false;
    }
  }
}
