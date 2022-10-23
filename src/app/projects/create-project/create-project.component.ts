import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, NavigationEnd, ActivatedRoute } from '@angular/router';

@Component({
	selector: 'app-create-project',
	templateUrl: './create-project.component.html',
	styleUrls: ['./create-project.component.scss']
})
export class CreateProjectComponent implements OnInit, OnDestroy {

	state: any = {
		projectID: '',
		activeStepper: ''
	}
	routerEvent: any;

	constructor(
		private router: Router,
		private activedRoute: ActivatedRoute
	) {
		this.routerEvent = router.events.subscribe(val => {
			if (val instanceof NavigationEnd) {
				this.state.projectID = val.url.split('/projects/create-project')[1].split('/').length >= 2 ? Number(val.url.split('/projects/create-project')[1].split('/')[1]) : null;
				if (val.url.split('/projects/create-project')[1].split('/').length == 3)
					this.state.activeStepper = val.url.split('/projects/create-project')[1].split('/')[2];
				else
					this.state.activeStepper = 'project';
			}
		})
	}

	ngOnInit() {
	}

	ngOnDestroy() {
		this.routerEvent.unsubscribe();
	}

	onChangeStepper(label) {
		// enable to work as functionality
		label = this.state.projectID ? label : (label == 'project' ? label : '');
		if (label) this.state.activeStepper = label;
		switch (label) {
			case 'project':
				this.router.navigate([this.state.projectID ? '/projects/create-project/' + this.state.projectID : '/projects/create-project'])
				break;

			case 'product':
				this.router.navigate(['/projects/create-project/' + this.state.projectID + '/product'])
				break;

			/*case 'spec':
				this.router.navigate(['/projects/create-project/' + this.state.projectID + '/specs'])
				break;*/

			case 'review':
				this.router.navigate(['/projects/create-project/' + this.state.projectID + '/review'])
				break;
			default:
				break;
		}
	}

}
