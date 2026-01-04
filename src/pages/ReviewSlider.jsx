import React from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Pagination } from 'swiper/modules';
import styles from '../css/ReviewCard.module.css';

// Importing Images
import personImg1 from "../assets/images/review/Ayaz.png";
import personImg2 from "../assets/images/review/rashid.png";
import personImg3 from "../assets/images/review/icon.png";
import personImg4 from "../assets/images/review/Shabaz.png";

import 'swiper/css';
import 'swiper/css/pagination';

const reviews = [
  { id: 1, name: "Muhammad Ayyaz", amount: "250 USD", date: "02 Jan 2026", img: personImg1, text: "Outstanding experience! Withdrawal received within minutes. Highly professional service." },
  { id: 2, name: "Rashid Jabbar", amount: "45,600 PKR", date: "01 Jan 2026", img: personImg2, text: "SolarPricePakistan project was a success. Payment received exactly as promised." },
  { id: 3, name: "M Abdullah", amount: "12,000 PKR", date: "30 Dec 2025", img: personImg3, text: "Clean and fast process. The transparency in transactions is what I like most." },
  { id: 4, name: "Shahbaz Gul", amount: "800 USD", date: "28 Dec 2025", img: personImg4, text: "Trustworthy company. Got my first big payout today without any delay. Thanks GBG!" },
  { id: 5, name: "Winston", amount: "350.00 USD", date: "25 Dec 2025", img: personImg3, text: "Seamless international withdrawal. Everything was smooth and secure." },
  { id: 6, name: "James Walker", amount: "1,200.00 USD", date: "22 Dec 2025", img: personImg3, text: "Real estate project payout received. Very impressed with the timely response." },
  { id: 7, name: "Ali Raza", amount: "15,500 PKR", date: "20 Dec 2025", img: personImg3, text: "Small but steady profits. Received directly into my bank account." },
  { id: 8, name: "Zeeshan Khan", amount: "32,000 PKR", date: "18 Dec 2025", img: personImg1, text: "Brilliant support and fast execution. My payment was cleared instantly." },
  { id: 9, name: "Usman Ghani", amount: "55,000 PKR", date: "15 Dec 2025", img: personImg2, text: "A reliable partner for long-term work. Third withdrawal received successfully!" },
  { id: 10, name: "Sara Ahmed", amount: "22,000 PKR", date: "12 Dec 2025", img: personImg3, text: "Very easy to use. No hidden fees, got the exact amount in my wallet." },
];

const ReviewSlider = () => {
  return (
    <div className={styles.sliderContainer}>
      {/* --- Added Title Section --- */}
      <div className={styles.sectionHeader}>
        <h2 className={styles.mainTitle}>Recent Successful Withdrawals</h2>
        <p className={styles.subTitle}>Real-time updates of our community members receiving their payouts.</p>
      </div>

      <Swiper
        modules={[Autoplay, Pagination]}
        spaceBetween={20}
        slidesPerView={1}
        loop={true}
        autoplay={{ delay: 3000, disableOnInteraction: false }}
        pagination={{ clickable: true }}
        breakpoints={{
          768: { slidesPerView: 2 },
          1100: { slidesPerView: 3 },
        }}
      >
        {reviews.map((item) => (
          <SwiperSlide key={item.id}>
            <div className={styles.card}>
              <div className={styles.header}>
                <img src={item.img} alt={item.name} className={styles.profileImg} />
                <div className={styles.info}>
                  <h3>{item.name}</h3>
                  <span className={styles.verified}>Verified User</span>
                </div>
              </div>

              <p className={styles.feedback}>"{item.text}"</p>

              <div className={styles.transactionBox}>
                <div className={styles.amountDetail}>
                  <span className={styles.label}>Withdrawn</span>
                  <span className={styles.amountText}>{item.amount}</span>
                </div>
                <div className={styles.dateDetail}>
                  <span className={styles.label}>Date</span>
                  <span className={styles.dateText}>{item.date}</span>
                </div>
              </div>

              <div className={styles.statusFooter}>
                <div className={styles.dot}></div>
                <span>Status: Received</span>
              </div>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
};

export default ReviewSlider;