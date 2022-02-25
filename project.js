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
            apple: new defs.Subdivision_Sphere(2),
        };

        this.base_ambient = 0.5;

        // *** Materials
        this.materials = {
            phong: new Material(new defs.Phong_Shader(), {ambient: this.base_ambient, diffusivity: 0.6, color: hex_color("#ffffff")}),
            test2: new Material(new Gouraud_Shader(), {ambient: this.base_ambient, diffusivity: 0.6, color: hex_color("#992828")}),
            test3: new Material(new defs.Phong_Shader(), {ambient: this.base_ambient, diffusivity: 0.6, color: hex_color("#ff8e31")}),
            test4: new Material(new defs.Phong_Shader(), {ambient: this.base_ambient, diffusivity: 1, color: color(0.5, 0.5, 0.5, 1)}),

            light_gadget: new Material(new defs.Phong_Shader(), {ambient: 1, diffusivity: 1, color: color(1, 1, 1, 1)}),
            floor: new Material(new defs.Phong_Shader(), {ambient: this.base_ambient, diffusivity: 0.8, specularity: 0.2, smoothness: 0, color: color(0.6, 0.1, 0.1, 1)}),

            stem: new Material(new defs.Phong_Shader(), {ambient: this.base_ambient, diffusivity: 0.6, color: hex_color("#693423")}),
            leaf: new Material(new defs.Phong_Shader(), {ambient: this.base_ambient, diffusivity: 0.6, color: hex_color("#2cb733")}),
            apple: new Material(new Gouraud_Shader(), {ambient: .4, diffusivity: .6, color: hex_color("#ff0000")}),

            skin: new Material(new defs.Phong_Shader(), {ambient: this.base_ambient, diffusivity: 0.6, color: hex_color("a97d64")}),
            shirt: new Material(new defs.Phong_Shader(), {ambient: this.base_ambient, diffusivity: 0.6, color: hex_color("494697")}),
            pants: new Material(new defs.Phong_Shader(), {ambient: this.base_ambient, diffusivity: 0.6, color: hex_color("#0eaeae")}),

            face: new Material(new defs.Fake_Bump_Map(1), {ambient: .5, texture: new Texture("assets/face.png")})
            
        }

        this.initial_camera_location = Mat4.look_at(vec3(0, 0, 10), vec3(0, 0, 0), vec3(0, 1, 0));
        this.camera_delta = vec3(0, 0, 0);

        this.physics_objects = [
            new Apple(vec3(0, 5, -3), vec3(0, 1, 0), this),
            new Apple(vec3(0, 5, -3), vec3(0, 0, 1), this),
            new Apple(vec3(0, 5, -3), vec3(1, 0, 1), this),
            new Apple(vec3(0, 5, -3), vec3(-1, 0, 0.5), this)
        ]
        this.kinematic_objects = [
            new Floor(vec3(0, -0.5, 0), this, 0.75, 0.97),
            new Model(vec3(0, 0, 0), this),
            new ChildModel(vec3(0, 0, 0), this)
        ]

    }
    make_control_panel() {
        // Draw the scene's buttons, setup their actions and keyboard shortcuts, and monitor live measurements.
        this.key_triggered_button("make objs jump", ["Control", "0"], function() {
            for(var obj of this.physics_objects) {
                obj.add_impulse(vec3(Math.random()*1, Math.random()*12, Math.random()*1));
                obj.angular_velocity = vec4(Math.random()*0.1, Math.random()*0.1, Math.random()*0.1, 0);
            }
        });
        this.new_line();
        this.key_triggered_button("spawn apple", ["Control", "1"], function() {
            this.physics_objects.push(new Apple(vec3(this.mro(4),Math.random()*4,this.mro(4)), vec3(this.mro(1),(Math.random()*1) + 4,this.mro(1)), this))
        });
        this.new_line();
    }

    mro(scale) {
        return (Math.random()-0.5)*scale;
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
        model_transform = model_transform.times(Mat4.translation(5, 0, 0));

        this.draw_environment(context, program_state);
        this.draw_light_gadgets(context, program_state);
        this.draw_physics_objects(context, program_state);

        //this.draw_model(context, program_state, model_transform)

        //let baby_transform = model_transform.times(Mat4.translation(-10, 0, 0)).times(Mat4.scale(.5, .5, .5));
        //this.draw_model(context, program_state, baby_transform);
        

    }

    draw_environment(context, program_state) {
        /* floor */
            //this.shapes.box.draw(context, program_state, Mat4.scale(10, 0.5, 10).times(Mat4.translation(0, -4, 0)), this.materials.tex)
        /* z- wall */
            this.shapes.box.draw(context, program_state, Mat4.scale(10, 8, 1).times(Mat4.translation(0, 0, -10)), this.materials.phong)
        /* x+ wall */
            this.shapes.box.draw(context, program_state, Mat4.scale(1, 8, 10).times(Mat4.translation(10, 0, 0)), this.materials.phong)
        /* x- wall */
            this.shapes.box.draw(context, program_state, Mat4.scale(1, 8, 10).times(Mat4.translation(-10, 0, 0)), this.materials.phong)

            //apple
            
    }

    draw_light_gadgets(context, program_state) {
        for(var light of program_state.lights) {
            this.shapes.sphere_4.draw(context, program_state, Mat4.translation(light.position[0], light.position[1], light.position[2], light.position[3]), this.materials.light_gadget)
        }
    }

    draw_physics_objects(context, program_state) {
        for(var object of this.kinematic_objects) {
            object.draw(context, program_state);
        }
        for(var object of this.physics_objects) {
            object.step(program_state, [this.kinematic_objects[0]]);
            object.draw(context, program_state);
        }
    }
}

class PhysicsObject {
    constructor(initial_position, initial_velocity, scene) {
        this.model_transform = Mat4.identity();
        this.bounds;
        this.scene = scene;
        this.scale = vec3(1, 1, 1);
        this.position = initial_position;
        this.velocity = initial_velocity;
        this.acceleration = vec3(0, -9.8, 0);
        this.rotation = vec4(0, 0, 0, 1);
        this.angular_velocity = vec4(0, 0, 0, 0);
        this.angular_drag = 0.95;
    }
    step(program_state, kobjs) {
        const t = program_state.animation_time;
        const dt = program_state.animation_delta_time;

        const dtm = dt * 0.001;

        this.velocity = this.velocity.plus(this.acceleration.times(dtm));
        this.position = this.position.plus(this.velocity.times(dtm));

        this.rotation = this.rotation.plus(this.angular_velocity);
        this.model_transform = Mat4.translation(this.position[0], this.position[1], this.position[2])
                                    .times(Mat4.rotation(this.rotation[0], this.rotation[1], this.rotation[2], this.rotation[3]))
                                    .times(Mat4.scale(this.scale[0], this.scale[1], this.scale[2]));
        
        for(var k of kobjs) {
            if(this.is_colliding(k)) {
                this.velocity[1] = Math.abs(this.velocity[1])*1;
                this.velocity[0] *= k.friction; this.velocity[2] *= k.friction;
                this.angular_velocity = this.angular_velocity.times(this.angular_drag);
                this.velocity[1] = k.damp*this.velocity[1];
                this.acceleration[1] = 0;
            } else {
                this.acceleration[1] = -9.8;
            }
        }
    }
    is_colliding(k) {
        let xc = this.position[0] > k.bounds[0] && this.position[0] < k.bounds[3];
        let yc = this.position[1]*(this.scale[1]*1.1) > k.bounds[1] && this.position[1]*(this.scale[1]*1.1) < k.bounds[4];
        let zc = this.position[2] > k.bounds[2] && this.position[2] < k.bounds[5];
        return (xc && yc && zc)
    }
    draw(context, program_state) {};
    add_impulse(vec) {
        this.velocity = this.velocity.plus(vec);
    }
}
class KinematicObject extends PhysicsObject {

    constructor(position, scene, damp, friction) {
        super(position, vec3(0, 0, 0), scene)
        this.damp = damp;
        this.friction = friction;
        this.bounds = null;
    }
}

class Apple extends PhysicsObject {

    constructor(position, initial_velocity, scene) {
        super(position, initial_velocity, scene);
        this.rotation = vec4(1, 0, 0, 1);
        this.angular_velocity = vec4(Math.random()*0.1, Math.random()*0.1, Math.random()*0.1, 0);
        this.scale = vec3(0.4, 0.4, 0.4);
    }

    draw(context, program_state) {
        let apple_transform = this.model_transform.times(Mat4.rotation(Math.PI, 0, 0, 1));
        this.scene.shapes.apple.draw(context, program_state, apple_transform, this.scene.materials.apple);

        let stem_transform = this.model_transform.times(Mat4.translation(0, 1, 0))
            .times(Mat4.scale(.1, .35, .1));
        this.scene.shapes.box.draw(context, program_state, stem_transform, this.scene.materials.stem);

        let leaf_transform = this.model_transform.times(Mat4.translation(0.5, 1.2, 0))
            .times(Mat4.scale(.3, .1, .1))
            .times(Mat4.rotation(Math.PI/6, 0, 0, 1));

        this.scene.shapes.box.draw(context, program_state, leaf_transform, this.scene.materials.leaf);

    }
}

class Model extends KinematicObject {
    
    constructor(position, scene) {
        super(position, scene);
        this.model_transform = Mat4.translation(5, 0, 0);
    }

    draw(context, program_state) {
        
        //Head
        this.scene.shapes.box.draw(context, program_state, this.model_transform.times(Mat4.translation(0, 5.5, 0)), this.scene.materials.skin);
        //Face
        this.scene.shapes.box.draw(context, program_state, this.model_transform.times(Mat4.scale(1, 1, 0.01)).times(Mat4.translation(0, 5.5, 100)), this.scene.materials.face);
        
        let body_transform = this.model_transform.times(Mat4.scale(1, 1.5, 0.5)).times(Mat4.translation(0, 2, 0))
        this.scene.shapes.box.draw(context, program_state, body_transform, this.scene.materials.shirt);
        //Legs
        this.scene.shapes.box.draw(context, program_state, this.model_transform.times(Mat4.scale(.5, 1.5, .5)).times(Mat4.translation(-1, 0, 0)), this.scene.materials.pants);
        this.scene.shapes.box.draw(context, program_state, this.model_transform.times(Mat4.scale(.5, 1.5, .5)).times(Mat4.translation(1, 0, 0)), this.scene.materials.pants);

        //Arms
        let larm_transform = body_transform.times(Mat4.scale(.5, 1, 1)).times(Mat4.translation(-3, 0, 0));
        let rarm_transform = body_transform.times(Mat4.scale(.5, 1, 1)).times(Mat4.translation(3, 0, 0));
        this.scene.shapes.box.draw(context, program_state, larm_transform, this.scene.materials.skin)
        this.scene.shapes.box.draw(context, program_state, rarm_transform, this.scene.materials.skin)

    }
}
class ChildModel extends KinematicObject {
    
    constructor(model_transform, scene) {
        super(model_transform, scene);
        this.model_transform = Mat4.translation(5, 0, 0).times(Mat4.translation(-10, 0, 0)).times(Mat4.scale(.5, .5, .5));
    }

    draw(context, program_state) {
        
        //Head
        this.scene.shapes.box.draw(context, program_state, this.model_transform.times(Mat4.translation(0, 5.5, 0)), this.scene.materials.skin);
        //Face
        this.scene.shapes.box.draw(context, program_state, this.model_transform.times(Mat4.scale(1, 1, 0.01)).times(Mat4.translation(0, 5.5, 100)), this.scene.materials.face);

        let body_transform = this.model_transform.times(Mat4.scale(1, 1.5, 0.5)).times(Mat4.translation(0, 2, 0))
        this.scene.shapes.box.draw(context, program_state, body_transform, this.scene.materials.shirt);
        //Legs
        this.scene.shapes.box.draw(context, program_state, this.model_transform.times(Mat4.scale(.5, 1.5, .5)).times(Mat4.translation(-1, 0, 0)), this.scene.materials.pants);
        this.scene.shapes.box.draw(context, program_state, this.model_transform.times(Mat4.scale(.5, 1.5, .5)).times(Mat4.translation(1, 0, 0)), this.scene.materials.pants);

        //Arms
        let larm_transform = body_transform.times(Mat4.scale(.5, 1, 1)).times(Mat4.translation(-3, 0, 0));
        let rarm_transform = body_transform.times(Mat4.scale(.5, 1, 1)).times(Mat4.translation(3, 0, 0));
        this.scene.shapes.box.draw(context, program_state, larm_transform, this.scene.materials.skin)
        this.scene.shapes.box.draw(context, program_state, rarm_transform, this.scene.materials.skin)

    }
}

class Floor extends KinematicObject {

    constructor(position, scene, damp, friction) {
        super(position, scene, damp, friction)
        this.model_transform = Mat4.scale(10, 0.5, 10)
                                    .times(Mat4.translation(0, -4, 0));
        this.materials = {
            tex: new Material(new defs.Fake_Bump_Map(1), {ambient: .5, texture: new Texture("assets/wood_floor.png")})
        }
        this.bounds = [-10, -100, -10, 10, -0.5, 10];
    }

    draw(context, program_state) {
        this.scene.shapes.box.draw(context, program_state, this.model_transform, this.materials.tex)
    }

}









