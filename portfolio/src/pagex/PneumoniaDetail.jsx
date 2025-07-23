// src/pages/PneumoniaDetail.jsx
import TitleContainer from "../components/TitleComponent";
import resnet101Confusion from "../assets/graphs/resnet101_confusion_matrix.png";
import resnet101Roc from "../assets/graphs/resnet101_roc_curve.png";
import resnet101Metrics from "../assets/graphs/resnet101_training_metrics.png";
import customCnnConfusion from "../assets/graphs/custom_cnn_confusion_matrix.png";
import customCnnRoc from "../assets/graphs/custom_cnn_roc_curve.png";
import customCnnMetrics from "../assets/graphs/custom_cnn_training_metrics.png";
import normalOutput from "../assets/samples/normalOutput.jpg";
import pneumoniaOutput from "../assets/samples/pneumoniaOutput.jpg";

const PneumoniaDetail = () => {
  const team = [
    {
      name: "Suryanshu Verma",
      linkedin: "https://www.linkedin.com/in/suryanshu-verma0/",
      portfolio: "https://www.suryanshuverma.com.np/",
    },
    {
      name: "Sohan Mehta",
      linkedin: "https://www.linkedin.com/in/sohan-mehta-79153123a/",
      portfolio: "https://www.sohanmehta.com.np/",
    },
    {
      name: "Surya Joshi",
      linkedin: "https://www.linkedin.com/in/surya-joshi-b279b8283/",
      portfolio: "https://www.suryajoshi.com.np/",
    },
  ];

  const metrics = {
    resnet101: {
      accuracy: "95.28%",
      rocAuc: "0.9883",
      precision: "95.47%",
      recall: "95.28%",
      f1: "95.33%",
    },
    customCnn: {
      accuracy: "96.05%",
      rocAuc: "0.9957",
      precision: "96.47%",
      recall: "96.05%",
      f1: "96.12%",
    },
  };

  return (
    <div className="bg-slate-200 dark:bg-neutral-950 w-full h-full text-gray-800 dark:text-gray-200">
      <div className="px-6 md:px-20 py-10 max-w-6xl mx-auto dark:bg-neutral-900 bg-white text-gray-800 dark:text-gray-200">
        <TitleContainer title="Pneumonia Detection Using Deep Learning Techniques" />

        <p className="mt-4 text-lg text-neutral-800 dark:text-gray-200 leading-relaxed">
          A minor project by three team members. We used both ResNet‑101 and a
          custom CNN to classify chest X‑ray images into{" "}
          <strong>Pneumonia</strong> or <strong>Normal</strong>. The system
          features interpretability via Grad‑CAM, comprehensive metric analysis,
          and visualization of model outputs.
        </p>

        {/* Team Members */}
        <section className="mt-8">
          <h2 className="text-2xl font-semibold text-neutral-800 dark:text-gray-200">
            Team Members
          </h2>
          <ul className="mt-3 list-disc list-inside text-md text-neutral-700 dark:text-gray-300 space-y-1">
            {team.map((t) => (
              <li key={t.name}>
                <strong>{t.name}</strong> –{" "}
                <a
                  href={t.linkedin}
                  className="text-blue-600 dark:text-blue-400 hover:underline"
                >
                  LinkedIn
                </a>
                ,{" "}
                <a
                  href={t.portfolio}
                  className="text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Portfolio
                </a>
              </li>
            ))}
          </ul>
        </section>

        {/* Model Comparison */}
        <section className="mt-12">
          <h2 className="text-2xl font-semibold text-neutral-800 dark:text-gray-200 mb-4">
            Model Comparison: ResNet‑101 vs Custom CNN
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            {/* ResNet-101 */}
            <div>
              <h3 className="text-xl font-semibold text-neutral-800 dark:text-gray-200 mb-2">
                ResNet‑101
              </h3>
              <img
                src={resnet101Metrics}
                alt="ResNet-101 Training Curves"
                className="rounded-lg shadow"
              />
              <ul className="mt-4 list-disc list-inside text-md text-neutral-700 dark:text-gray-300 space-y-1">
                {Object.entries(metrics.resnet101).map(([k, v]) => (
                  <li key={k}>
                    <strong>{k.toUpperCase()}:</strong> {v}
                  </li>
                ))}
              </ul>
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                <img
                  src={resnet101Confusion}
                  alt="ResNet-101 Confusion Matrix"
                  className="rounded-lg shadow"
                />
                <img
                  src={resnet101Roc}
                  alt="ResNet-101 ROC Curve"
                  className="rounded-lg shadow"
                />
              </div>
            </div>

            {/* Custom CNN */}
            <div>
              <h3 className="text-xl font-semibold text-neutral-800 dark:text-gray-200 mb-2">
                Custom CNN
              </h3>
              <img
                src={customCnnMetrics}
                alt="Custom CNN Training Curves"
                className="rounded-lg shadow"
              />
              <ul className="mt-4 list-disc list-inside text-md text-neutral-700 dark:text-gray-300 space-y-1">
                {Object.entries(metrics.customCnn).map(([k, v]) => (
                  <li key={k}>
                    <strong>{k.toUpperCase()}:</strong> {v}
                  </li>
                ))}
              </ul>
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                <img
                  src={customCnnConfusion}
                  alt="Custom CNN Confusion Matrix"
                  className="rounded-lg shadow"
                />
                <img
                  src={customCnnRoc}
                  alt="Custom CNN ROC Curve"
                  className="rounded-lg shadow"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Sample Outputs */}
        <section className="mt-12">
          <h2 className="text-2xl font-semibold text-neutral-800 dark:text-gray-200 mb-4">
            Sample Chest X‑Ray Outputs
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <div className="text-center">
              <img
                src={normalOutput}
                alt="Normal X-ray"
                className="rounded-lg shadow mx-auto"
              />
              <p className="mt-2 text-neutral-700 dark:text-gray-300">
                Normal X‑ray
              </p>
            </div>
            <div className="text-center">
              <img
                src={pneumoniaOutput}
                alt="Pneumonia X-ray"
                className="rounded-lg shadow mx-auto"
              />
              <p className="mt-2 text-neutral-700 dark:text-gray-300">
                Pneumonia X‑ray
              </p>
            </div>
          </div>
        </section>

        {/* Full Report Link */}
        <section className="mt-12 flex justify-center">
         

          <button
            onClick={() =>
              window.open(
                "https://github.com/suryanshuverma0/PneumoniaDetectionSystem",
                "_blank",
                "noreferrer"
              )
            }
            className={`px-4 py-2 bg-transparent border-black hover:bg-black hover:text-white dark:hover:bg-white dark:text-white dark:hover:text-black transition-colors border dark:border-white rounded:md cursor-pointer`}
          >
            View Full Report & Code
          </button>
        </section>
      </div>
    </div>
  );
};

export default PneumoniaDetail;
