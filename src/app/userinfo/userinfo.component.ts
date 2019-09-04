import { Component, OnInit } from "@angular/core";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { UserDataService } from "./user-data.service";
import { users } from "./userinfo";
import { Router } from "@angular/router";

@Component({
  selector: "app-userinfo",
  templateUrl: "./userinfo.component.html",
  styleUrls: ["./userinfo.component.css"]
})
export class UserinfoComponent implements OnInit {
  registerForm: FormGroup;
  submitted = false;
  users: Promise<users[]>;
  user: users;
  constructor(
    private formBuilder: FormBuilder,
    private readonly userService: UserDataService,
    private readonly router: Router
  ) {
    this.userService.requestSync();
    navigator.serviceWorker.addEventListener("message", event => {
      if (event.data === "sync_finished") {
        this.users = this.userService.getTodos();
      }
    });
  }

  ngOnInit() {
    this.registerForm = this.formBuilder.group({
      firstName: ["", Validators.required],
      lastname: ["", Validators.required],
      email: ["", [Validators.required, Validators.email]]
    });
  }

  get f() {
    return this.registerForm.controls;
  }

  onSubmit() {
    this.submitted = true;

    // stop here if form is invalid
    if (this.registerForm.invalid) {
      return;
    }
    const user: any = {};
    console.log("this.user", this.registerForm.value.firstName);
    user["firstName"] = this.registerForm.value.firstName;
    user["lastname"] = this.registerForm.value.lastname;
    user["email"] = this.registerForm.value.email;
    console.log("this.user", user);
    this.userService.save(user);
    alert("SUCCESS!! :-)");
    // this.router.navigateByUrl("/");
  }

  addTodo() {
    this.router.navigateByUrl("/edit");
  }

  ionViewDidEnter() {
    this.users = this.userService.getTodos();
  }
}
