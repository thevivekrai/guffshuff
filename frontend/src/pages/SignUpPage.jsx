import { useState } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { Eye, EyeOff, Loader2, Lock, User, School, Edit3, Mail } from "lucide-react";
import { Link } from "react-router-dom";
import AuthImagePattern from "../components/AuthImagePattern";
import toast from "react-hot-toast";
import logo from "../assets/logo.png";

const schools = [
 "Assam Medical College",  
"Central Institute of Technology (CIT), Dibrugarh",  
"Delhi Public School, Dibrugarh",  
"D.H.S.K. College",  
"D.H.S.K. Commerce College",  
"D.H.S.K. Law College",  
"Dibru College",  
"Dibrugarh Commerce College",  
"Dibrugarh Government Boys’ Higher Secondary School",  
"Dibrugarh Government College",  
"Dibrugarh Government Girls’ Higher Secondary School",  
"Dibrugarh Hanumanbax Surajmal Kanoi Academy",  
"Dibrugarh Kendriya Mahavidyalaya",  
"Dibrugarh Law College",   
"Dibrugarh University",  
"Digboi College",  
"Don Bosco Academy",  
"Don Bosco High School",  
"Don Bosco Higher Secondary School, Dibrugarh",  
"Donyi Polo College for Higher Education",  
"Dr. Rohini Kanta Barua Law College",  
"Duliajan College",  
"Duliajan Girls' College",  
"Guru Teg Bahadur School",  
"Gyan Vigyan Academy",  
"Hemalata Handiqui Memorial Institute",  
"Holy Child School",  
"Indreswar Sharma Academy Degree College",  
"Institute of Engineering and Technology, Dibrugarh University",  
"ITBP Public School, Mohanbari",  
"Jawahar Navodaya Vidyalaya",  
"Joypur Higher Secondary School",  
"Kendriya Vidyalaya, Dibrugarh",  
"Khowang College",  
"Lahowal College",  
"Little Flower Higher Secondary School, Dibrugarh",  
"Little Star School",  
"M.D.K.G. College",  
"Moran Commerce College",  
"Naharkatiya College",  
"Namrup College",  
"Namrup College of Teacher Education",  
"Nandalal Borgohain City College",  
"Niranjan School",  
"North East Institute of Management Science",  
"Nurture International School",   
"Oil Valley School",  
"Parijat Academy Teacher Education Institution",  
"Pithubar Girls' Degree College",  
"Radha Krishna School",  
"Regional Dental College, Dibrugarh",  
"S.I.P.E. Law College",  
"Salt Brook Academy",  
"Sampoorna Kendra Vidyalaya, Dibrugarh",  
"Shiksha Valley School, Sessa",  
"Shreebharati College",  
"South Point School",  
"S.I.P.E. Law College",  
"Srimanta Sankar Academy",  
"St. Francis School",  
"St. Joseph’s School",  
"St. Mary’s High School",  
"St. Xavier's School, Dibrugarh",  
"St. Jute School",  
"Sunbeam School",  
"Tengakhat College",  
"Vivekananda Kendra Vidyalaya",  
"Vivekananda Kendra Vidyalaya, Dibrugarh",  
"Women’s College, Dibrugarh",  
"Air Force School, Chabua",  
"Army Public School, Dinjan",  
"Assam Vidyapith Higher Secondary School, Chabua",  
  // ...other schools...
  "Other"
];

const SignUpPage = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    username: "",
    password: "",
    school: "",
    otherSchool: "",
    bio: "",
    email: "", // Add email field
  });

  const { signup, isSigningUp } = useAuthStore();

  const validateForm = () => {
    if (!formData.fullName.trim()) return toast.error("Full name is required");
    if (!formData.username.trim()) return toast.error("Username is required");
    if (formData.username.length < 5) return toast.error("Username must be at least 5 characters");
   if (!/^[a-z0-9!@#$%^&*()_+\-=<>?]+$/.test(formData.username))return toast.error("Username must be lowercase and cannot include no spaces");

    if (!formData.password) return toast.error("Password is required");
    if (formData.password.length < 6) return toast.error("Password must be at least 6 characters");
    if (!formData.school) return toast.error("School/College is required");
    if (formData.school === "Other" && !formData.otherSchool.trim()) return toast.error("Please specify your school/college");
    if (!formData.email.trim()) return toast.error("Email is required");
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) return toast.error("Invalid email format");

    return true;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const success = validateForm();

    if (success === true) {
      const data = { ...formData };
      if (data.school === "Other") {
        data.school = data.otherSchool;
        delete data.otherSchool;
      }
      signup(data);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* left side */}
      <div className="flex flex-col justify-center items-center p-6 sm:p-12">
        <div className="w-full max-w-md space-y-8">
          {/* LOGO */}
          <div className="text-center mb-8">
            <div className="flex flex-col items-center gap-2 group">
              <div
                className="size-12 rounded-xl bg-primary/10 flex items-center justify-center 
              group-hover:bg-primary/20 transition-colors"
              >
                <img src={logo} className="size-6" alt="Logo" />
              </div>
              <h1 className="text-2xl font-bold mt-2">Create Account</h1>
              <p className="text-base-content/60">Get started with your free account</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">Full Name</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="size-5 text-base-content/40" />
                </div>
                <input
                  type="text"
                  className={`input input-bordered w-full pl-10`}
                  placeholder="Enter your name"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                />
              </div>
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">Username</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="size-5 text-base-content/40" />
                </div>
                <input
                  type="text"
                  className={`input input-bordered w-full pl-10`}
                  placeholder="Enter the username"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  autoCapitalize="none"
                  autoComplete="off"
                />
              </div>
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">Password</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="size-5 text-base-content/40" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  className={`input input-bordered w-full pl-10`}
                  placeholder="Enter the password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="size-5 text-base-content/40" />
                  ) : (
                    <Eye className="size-5 text-base-content/40" />
                  )}
                </button>
              </div>
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">School/College</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <School className="size-5 text-base-content/40" />
                </div>
                <select
                  className={`input input-bordered w-full pl-10`}
                  value={formData.school}
                  onChange={(e) => setFormData({ ...formData, school: e.target.value })}
                >
                  <option value="" disabled>Select your school/college</option>
                  {schools.map((school) => (
                    <option key={school} value={school}>
                      {school}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {formData.school === "Other" && (
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">Specify School/College</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <School className="size-5 text-base-content/40" />
                  </div>
                  <input
                    type="text"
                    className={`input input-bordered w-full pl-10`}
                    placeholder="Enter your school/college"
                    value={formData.otherSchool}
                    onChange={(e) => setFormData({ ...formData, otherSchool: e.target.value })}
                  />
                </div>
              </div>
            )}

            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">Bio</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Edit3 className="size-5 text-base-content/40" />
                </div>
                <textarea
                  className={`input input-bordered w-full pl-10`}
                  placeholder="Tell us about yourself"
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                />
              </div>
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">Email</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="size-5 text-base-content/40" /> {/* Add email icon */}
                </div>
                <input
                  type="email"
                  className="input input-bordered w-full pl-10"
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
            </div>

            <button type="submit" className="btn btn-primary w-full" disabled={isSigningUp}>
              {isSigningUp ? (
                <>
                  <Loader2 className="size-5 animate-spin" />
                  Loading...
                </>
              ) : (
                "Create Account"
              )}
            </button>
          </form>

          <div className="text-center">
            <p className="text-base-content/60">
              Already have an account?{" "}
              <Link to="/login" className="link link-primary">
                Login
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* right side */}

      <AuthImagePattern
        title="Join Sigma community of students"
        subtitle="For inquiry mail us at- the.vivekrai@hotmail.com or DM us on Instagram @guffshuff"
      />
    </div>
  );
};
export default SignUpPage;
