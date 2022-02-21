import {defs, tiny} from './examples/common.js';
import {Gouraud_Shader, Ring_Shader} from './examples/shaders.js'
import {Shape_From_File} from './examples/obj-file-demo.js'

const {
    Vector, Vector3, vec, vec3, vec4, color, hex_color, Shader, Matrix, Mat4, Light, Shape, Material, Texture, Scene,
} = tiny;

export class Project extends Scene {
    constructor() {
        // constructor(): Scenes begin by populating initial values like the Shapes and Materials they'll need.
        super();

        // At the beginning of our program, load one of each of these shape definitions onto the GPU.
        this.shapes = {
            torus: new defs.Torus(40, 40),
            torus2: new defs.Torus(3, 15),
            flat_sphere_1: new (defs.Subdivision_Sphere.prototype.make_flat_shaded_version())(1),
            sphere_4: new defs.Subdivision_Sphere(4),
            circle: new defs.Regular_2D_Polygon(1, 15),
            box: new defs.Cube(), 
            apple: new Shape_From_File('./assets/apple.obj')
        };

        this.base_ambient = 0.5;
        const bump = new defs.Fake_Bump_Map(1);

        // *** Materials
        this.materials = {
            test: new Material(new defs.Phong_Shader(), {ambient: this.base_ambient, diffusivity: 0.6, color: hex_color("#ffffff")}),
            test2: new Material(new Gouraud_Shader(), {ambient: this.base_ambient, diffusivity: 0.6, color: hex_color("#992828")}),
            test3: new Material(new defs.Phong_Shader(), {ambient: this.base_ambient, diffusivity: 0.6, color: hex_color("#ff8e31")}),
            test4: new Material(new defs.Phong_Shader(), {ambient: this.base_ambient, diffusivity: 1, color: color(0.5, 0.5, 0.5, 1)}),

            light_gadget: new Material(new defs.Phong_Shader(), {ambient: 1, diffusivity: 1, color: color(1, 1, 1, 1)}),
            floor: new Material(new defs.Phong_Shader(), {ambient: this.base_ambient, diffusivity: 0.8, specularity: 0.2, smoothness: 0, color: color(0.6, 0.1, 0.1, 1)}),
            tex: new Material(bump, {ambient: .5, texture: new Texture("assets/wood_floor.png")}),
            apple: new Material(new defs.Textured_Phong(1), { color: color(1, .5, .5, 1), ambient: .3, diffusivity: .5, specularity: .5, texture: new Texture("assets/apple_color.jpg")})
        }

        this.initial_camera_location = Mat4.look_at(vec3(0, 0, 10), vec3(0, 0, 0), vec3(0, 1, 0));
        this.camera_delta = vec3(0, 0, 0);

        this.physics_objects = [
            new PhysicsObject('apple', this.shapes.apple, Mat4.identity(), this.materials.apple)
        ]

    }
    make_control_panel() {
        // Draw the scene's buttons, setup their actions and keyboard shortcuts, and monitor live measurements.
        this.key_triggered_button("make objs jump", ["Control", "0"], function() {
            for(var obj of this.physics_objects) {
                obj.add_impulse(vec3(0, 10, 0));
            }
        });
        this.new_line();
    }

    display(context, program_state) {

        if (!context.scratchpad.controls) {
            this.children.push(context.scratchpad.controls = new defs.Movement_Controls());
            program_state.set_camera(this.initial_camera_location);
        }

        program_state.set_camera(this.initial_camera_location);

        program_state.projection_transform = Mat4.perspective(Math.PI / 4, context.width / context.height, .1, 1000);

        const t = program_state.animation_time / 1000, dt = program_state.animation_delta_time / 1000;

        const light_position = vec4(0, 2*Math.sin(t) + 4, 0, 1);
        program_state.lights = [new Light(light_position, hex_color('#ffffff'), 10**2)];

        let model_transform = Mat4.identity();

        this.draw_environment(context, program_state);
        this.draw_light_gadgets(context, program_state);
        this.draw_physics_objects(context, program_state);

    }

    draw_environment(context, program_state) {
        /* floor */
            this.shapes.box.draw(context, program_state, Mat4.scale(10, 0.5, 10).times(Mat4.translation(0, -4, 0)), this.materials.tex)
        /* z- wall */
            this.shapes.box.draw(context, program_state, Mat4.scale(10, 8, 1).times(Mat4.translation(0, 0, -10)), this.materials.test)
        /* x+ wall */
            this.shapes.box.draw(context, program_state, Mat4.scale(1, 8, 10).times(Mat4.translation(10, 0, 0)), this.materials.test)
        /* x- wall */
            this.shapes.box.draw(context, program_state, Mat4.scale(1, 8, 10).times(Mat4.translation(-10, 0, 0)), this.materials.test)

            //apple
            
    }

    draw_light_gadgets(context, program_state) {
        for(var light of program_state.lights) {
            this.shapes.sphere_4.draw(context, program_state, Mat4.translation(light.position[0], light.position[1], light.position[2], light.position[3]), this.materials.light_gadget)
        }
    }

    draw_physics_objects(context, program_state) {
        for(var object of this.physics_objects) {
            object.step(program_state);
            object.draw(context, program_state);
        }
    }


}

class PhysicsObject {
    constructor(name, shape, model_transform, material) {
        this.name = name;
        this.shape = shape;
        this.model_transform = model_transform;
        this.material = material;
        this.position = vec3(0, 2, 0);
        this.velocity = vec3(0, 1, 0);
        this.acceleration = vec3(0, -9.8, 0);
        this.drag = 1.0;
    }
    step(program_state) {
        const t = program_state.animation_time;
        const dt = program_state.animation_delta_time;

        const dtm = dt * 0.001;

        
        

        if(this.position[1] < -0.3) {
            this.velocity[1] = -0.7*this.velocity[1] + 0.3;
        }
        this.velocity = this.velocity.plus(this.acceleration.times(dtm));
        this.velocity = this.velocity.times(this.drag);
        this.position = this.position.plus(this.velocity.times(dtm));
        
        this.model_transform = Mat4.translation(this.position[0], this.position[1], this.position[2]);

    }
    draw(context, program_state) {
        this.shape.draw(context, program_state, this.model_transform, this.material)
    }
    add_impulse(vec) {
        this.velocity = this.velocity.plus(vec);
    }
}




