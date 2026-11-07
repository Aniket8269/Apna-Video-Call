
import * as React from "react";
import {
  Avatar,
  Box,
  Button,
  Checkbox,
  CssBaseline,
  FormControlLabel,
  IconButton,
  InputAdornment,
  Paper,
  Snackbar,
  Stack,
  TextField,
  ThemeProvider,
  Typography,
  createTheme,
} from "@mui/material";

import VideocamRoundedIcon from "@mui/icons-material/VideocamRounded";
import VisibilityRoundedIcon from "@mui/icons-material/VisibilityRounded";
import VisibilityOffRoundedIcon from "@mui/icons-material/VisibilityOffRounded";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import AuthContext from "../Contexts/AuthContext";
import { useNavigate, useSearchParams } from "react-router-dom";

const theme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#ff9f0a",
      contrastText: "#171717",
    },
    background: {
      default: "#f5f6fa",
      paper: "#ffffff",
    },
    text: {
      primary: "#171923",
      secondary: "#74798a",
    },
  },
  typography: {
    fontFamily: '"Inter", "Segoe UI", Arial, sans-serif',
    button: {
      textTransform: "none",
      fontWeight: 600,
    },
  },
  shape: {
    borderRadius: 12,
  },
});

export default function Authentication() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [formState, setFormState] = React.useState(
    searchParams.get("mode") === "register" ? 1 : 0,
  );
  const [name, setName] = React.useState("");
  const [username, setUsername] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const [rememberMe, setRememberMe] = React.useState(true);
  const [message, setMessage] = React.useState("");
  const [open, setOpen] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);

  const isSignUp = formState === 1;

  const { handleRegister, handleLogin } = React.useContext(AuthContext);

  React.useEffect(() => {
    setFormState(searchParams.get("mode") === "register" ? 1 : 0);
    setMessage("");
  }, [searchParams]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage("");

    if (isSignUp && !name.trim()) {
      setMessage("Please enter your full name.");
      return;
    }

    if (!username.trim() || !password) {
      setMessage("Please enter your username and password.");
      return;
    }

    setSubmitting(true);
    try {
      if (isSignUp) {
        await handleRegister(name.trim(), username.trim(), password);
      } else {
        await handleLogin(username.trim(), password, rememberMe);
      }

      navigate("/home", { replace: true });
    } catch (error) {
      const errorMessage =
        error?.response?.data?.message ||
        error?.message ||
        "Unable to connect to the server. Please try again.";

      setMessage(errorMessage);
      setOpen(true);
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = (_event, reason) => {
    if (reason !== "clickaway") {
      setOpen(false);
    }
  };

  const switchForm = (nextForm) => {
    setFormState(nextForm);
    setMessage("");
    setPassword("");
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />

      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          bgcolor: "#f5f6fa",
          p: { xs: 0, md: 3 },
        }}
      >
        <Paper
          elevation={0}
          sx={{
            width: "100%",
            maxWidth: 1440,
            minHeight: { xs: "100vh", md: "calc(100vh - 48px)" },
            mx: "auto",
            display: "flex",
            overflow: "hidden",
            borderRadius: { xs: 0, md: "28px" },
            border: { xs: "none", md: "1px solid #e9eaf0" },
            boxShadow: {
              xs: "none",
              md: "0 24px 80px rgba(24, 30, 60, 0.08)",
            },
          }}
        >
          {/* LEFT: BRANDING SECTION */}

          <Box
            sx={{
              display: { xs: "none", md: "flex" },
              flex: 1,
              minWidth: 0,
              flexDirection: "column",
              justifyContent: "space-between",
              position: "relative",
              overflow: "hidden",
              p: { md: 5, lg: 7 },
              color: "#ffffff",
              background:
                "radial-gradient(circle at 85% 15%, #35466e 0%, transparent 35%), linear-gradient(145deg, #10172d 0%, #192643 55%, #111827 100%)",
            }}
          >
            {/* Decorative circles */}

            <Box
              sx={{
                position: "absolute",
                width: 350,
                height: 350,
                border: "1px solid rgba(255,255,255,0.10)",
                borderRadius: "50%",
                right: -130,
                bottom: 100,
              }}
            />

            <Box
              sx={{
                position: "absolute",
                width: 250,
                height: 250,
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: "50%",
                right: -80,
                bottom: 150,
              }}
            />

            {/* Brand */}

            <Stack
              direction="row"
              spacing={1.5}
              alignItems="center"
              sx={{ position: "relative", zIndex: 1 }}
            >
              <Avatar
                variant="rounded"
                sx={{
                  bgcolor: "#ffa500",
                  color: "#171923",
                  width: 46,
                  height: 46,
                  borderRadius: "14px",
                }}
              >
                <VideocamRoundedIcon fontSize="medium" />
              </Avatar>

              <Typography
                variant="h5"
                fontWeight={800}
                letterSpacing="-0.7px"
                
              >
                Apna{" "}
                <Box component="span" sx={{ color: "#ffa500" }}>
                  Video Call
                </Box>
              </Typography>
            </Stack>

            {/* Hero content */}

            <Box sx={{ position: "relative", zIndex: 1, my: 6 }}>
              <Typography
                variant="h2"
                sx={{
                  maxWidth: 600,
                  fontWeight: 800,
                  fontSize: { md: "2.8rem", lg: "4rem" },
                  lineHeight: 1.12,
                  letterSpacing: "-2px",
                }}
              >
                Great conversations,
                <Box
                  component="span"
                  sx={{ display: "block", color: "#ffa500" }}
                >
                  no matter the distance.
                </Box>
              </Typography>

              <Typography
                sx={{
                  mt: 3,
                  maxWidth: 450,
                  color: "#bdc5d8",
                  fontSize: "1.05rem",
                  lineHeight: 1.9,
                }}
              >
                Connect face-to-face with the people who matter.
                Simple, seamless video calling starts here.
              </Typography>

              {/* Feature cards */}

              <Stack spacing={2} sx={{ mt: 5, maxWidth: 420 }}>
                {[
                  ["01", "Connect from anywhere"],
                  ["02", "Enjoy real-time conversations"],
                  ["03", "Stay close to your people"],
                ].map(([number, label]) => (
                  <Stack
                    key={number}
                    direction="row"
                    alignItems="center"
                    spacing={2}
                    sx={{
                      p: 1.8,
                      borderRadius: 3,
                      border: "1px solid rgba(255,255,255,0.10)",
                      bgcolor: "rgba(255,255,255,0.04)",
                    }}
                  >
                    <Typography
                      fontWeight={800}
                      sx={{ color: "#ffa500" }}
                    >
                      {number}
                    </Typography>

                    <Typography color="#edf0f7" fontWeight={500}>
                      {label}
                    </Typography>
                  </Stack>
                ))}
              </Stack>
            </Box>
          </Box>

          {/* RIGHT: AUTHENTICATION FORM */}

          <Box
            sx={{
              width: { xs: "100%", md: 480, lg: 540 },
              flexShrink: 0,
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              p: { xs: 3, sm: 5, md: 5, lg: 7 },
              bgcolor: "#ffffff",
            }}
          >
            {/* Mobile brand */}

            <Stack
              direction="row"
              alignItems="center"
              spacing={1.2}
              sx={{ display: { xs: "flex", md: "none" }, mb: 5 }}
            >
              <Avatar
                variant="rounded"
                sx={{
                  bgcolor: "#ffa500",
                  color: "#171923",
                  borderRadius: 2,
                }}
              >
                <VideocamRoundedIcon />
              </Avatar>

              <Typography fontWeight={800} variant="h6">
                Apna{" "}
                <Box component="span" sx={{ color: "#ff9f0a" }}>
                  Video Call
                </Box>
              </Typography>
            </Stack>

            <Box sx={{ width: "100%", maxWidth: 390, mx: "auto" }}>
              <Typography
                variant="overline"
                sx={{
                  color: "#f29a00",
                  fontWeight: 800,
                  letterSpacing: 2,
                }}
              >
                {isSignUp ? "GET STARTED" : "WELCOME BACK"}
              </Typography>

              <Typography
                variant="h4"
                sx={{
                  mt: 1,
                  fontWeight: 800,
                  letterSpacing: "-1.2px",
                }}
              >
                {isSignUp ? "Create your account" : "Sign in to continue"}
              </Typography>

              <Typography
                sx={{ mt: 1.5, color: "text.secondary", lineHeight: 1.7 }}
              >
                {isSignUp
                  ? "Create an account and start connecting with people."
                  : "Enter your details to get back to your conversations."}
              </Typography>

              {/* Sign-in / Sign-up toggle */}

              <Box
                sx={{
                  display: "flex",
                  p: 0.6,
                  mt: 4,
                  mb: 2,
                  bgcolor: "#f1f2f6",
                  borderRadius: "14px",
                }}
              >
                {["Sign In", "Sign Up"].map((label, index) => (
                  <Button
                    key={label}
                    fullWidth
                    onClick={() => switchForm(index)}
                    variant="text"
                    sx={{
                      py: 1.2,
                      borderRadius: "10px",
                      color: formState === index ? "#171923" : "#777d8d",
                      bgcolor:
                        formState === index ? "#ffffff" : "transparent",
                      boxShadow:
                        formState === index
                          ? "0 2px 8px rgba(20,25,45,0.08)"
                          : "none",
                      "&:hover": {
                        bgcolor:
                          formState === index ? "#ffffff" : "#e8eaf0",
                      },
                    }}
                  >
                    {label}
                  </Button>
                ))}
              </Box>

              {/* Authentication form */}

              <Box component="form" onSubmit={handleSubmit} noValidate>
                {isSignUp && (
                  <TextField
                    margin="normal"
                    required
                    fullWidth
                    label="Full name"
                    name="name"
                    autoComplete="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    autoFocus
                    sx={fieldStyles}
                  />
                )}

                <TextField
                  margin="normal"
                  required
                  fullWidth
                  label="Username"
                  name="username"
                  autoComplete="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  autoFocus={!isSignUp}
                  sx={fieldStyles}
                />

                <TextField
                  margin="normal"
                  required
                  fullWidth
                  label="Password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete={
                    isSignUp ? "new-password" : "current-password"
                  }
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  sx={fieldStyles}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          aria-label={
                            showPassword ? "Hide password" : "Show password"
                          }
                          onClick={() =>
                            setShowPassword((previous) => !previous)
                          }
                          edge="end"
                        >
                          {showPassword ? (
                            <VisibilityOffRoundedIcon />
                          ) : (
                            <VisibilityRoundedIcon />
                          )}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />

                {!isSignUp && (
                  <Stack
                    direction="row"
                    alignItems="center"
                    justifyContent="space-between"
                    sx={{ mt: 1 }}
                  >
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={rememberMe}
                          onChange={(e) => setRememberMe(e.target.checked)}
                          size="small"
                          sx={{
                            color: "#a4a8b5",
                          
                            "&.Mui-checked": { color: "#ff9f0a" },
                          }}
                        />
                      }
                      label={
                        <Typography variant="body2" color="text.secondary">
                          Remember me
                        </Typography>
                      }
                    />

                  </Stack>
                )}

                {message && (
                  <Typography
                    role="status"
                    aria-live="polite"
                    sx={{
                      mt: 2,
                      color: "#b45309",
                      fontSize: "0.875rem",
                    }}
                  >
                    {message}
                  </Typography>
                )}

                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  disabled={submitting}
                  endIcon={<ArrowForwardRoundedIcon />}
                  sx={{
                    mt: 3,
                    py: 1.6,
                    borderRadius: "12px",
                    bgcolor: "#ffa500",
                    color: "#171717",
                    fontSize: "1rem",
                    fontWeight: 700,
                    boxShadow: "0 8px 20px rgba(255,165,0,0.20)",
                    "&:hover": {
                      bgcolor: "#f59a00",
                      boxShadow: "0 10px 24px rgba(255,165,0,0.30)",
                      transform: "translateY(-1px)",
                    },
                    transition: "all 0.2s ease",
                  }}
                >
                  {submitting
                    ? "Please wait..."
                    : isSignUp
                      ? "Create Account"
                      : "Sign In"}
                </Button>
              </Box>

              
              
            </Box>
          </Box>
        </Paper>
      </Box>

      <Snackbar
      open={open}
      autoHideDuration={6000}
      onClose={handleClose}
      message={message}
      />

    </ThemeProvider>
  );
}

const fieldStyles = {
  "& .MuiOutlinedInput-root": {
    borderRadius: "12px",
    bgcolor: "#ffffff",
    "& fieldset": {
      borderColor: "#e1e4ec",
    },
    "&:hover fieldset": {
      borderColor: "#b6bac7",
    },
    "&.Mui-focused fieldset": {
      borderColor: "#ffa500",
      borderWidth: "1.5px",
    },
  },
  "& .MuiInputLabel-root.Mui-focused": {
    color: "#d98500",
  },
};
